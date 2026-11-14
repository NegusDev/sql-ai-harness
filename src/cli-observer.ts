
import process from 'node:process';
import type {
  AgentObserver,
  AgentToolEvent,
} from './core/agent/observability.js';
import { highlightSql } from './ui/sql-highlight.js';
import type { Spinner } from './ui/spinner.js';
import { createStyle, terminalWidth, truncateVisible, type Style } from './ui/style.js';

function formatInput(input: unknown): string {
  if (!input || typeof input !== 'object') {
    return String(input ?? '');
  }

  const value = input as Record<string, unknown>;

  if (typeof value.sql === 'string') {
    return value.sql;
  }

  return JSON.stringify(value);
}

function getRowCount(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;

  const value = data as Record<string, unknown>;

  if (typeof value.rowCount === 'number') {
    return value.rowCount;
  }

  if (Array.isArray(value.rows)) {
    return value.rows.length;
  }

  return undefined;
}

function emitStructuredEvent(event: AgentToolEvent): void {
  if (process.env.SQL_AI_TRACE_JSON !== '1') return;
  if (event.type !== 'tool-end') return;

  try {
    const json = JSON.stringify(
      {
        source: 'dbask',
        ...event,
      },
      (_key, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
    );

    if (json) {
      // One complete JSON object per line, on stderr.
      console.error(json);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        source: 'dbask',
        type: 'trace-serialization-error',
        message:
          error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

const SPINNER_LABELS: Record<string, string> = {
  get_relationships: 'Checking foreign keys',
  list_tables: 'Listing tables',
  describe_table: 'Inspecting schema',
  describe_tables: 'Inspecting schema',
  submit_query_plan: 'Checking the query plan',
  execute_query: 'Running query',
  explain_query: 'Explaining query',
};

type Plain = Record<string, unknown>;

function asRecord(value: unknown): Plain | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Plain) : undefined;
}

function refName(ref: unknown): string {
  const record = asRecord(ref);
  return record ? `${String(record.table ?? '?')}.${String(record.column ?? '?')}` : String(ref);
}

/** Lines describing a submitted plan; tolerates plans that do not match the schema. */
export function describePlan(input: unknown): Array<[string, string]> {
  const plan = asRecord(input);
  if (!plan) return [];

  const rows: Array<[string, string]> = [];
  const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

  if (typeof plan.objective === 'string') rows.push(['objective', plan.objective]);
  if (list(plan.tables).length) rows.push(['tables', list(plan.tables).join(', ')]);
  if (list(plan.fields).length) rows.push(['fields', list(plan.fields).map(refName).join(', ')]);

  const joins = list(plan.joins).map((join) => {
    const record = asRecord(join);
    return record && ('left' in record || 'right' in record)
      ? `${refName(record.left)} = ${refName(record.right)}`
      : String(join);
  });
  if (joins.length) rows.push(['joins', joins.join('; ')]);
  if (list(plan.filters).length) rows.push(['filters', list(plan.filters).join('; ')]);
  if (list(plan.aggregations).length) rows.push(['aggregates', list(plan.aggregations).join('; ')]);
  if (list(plan.sorting).length) rows.push(['sorting', list(plan.sorting).join('; ')]);

  return rows;
}

function summarize(name: string, data: unknown): string {
  const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

  if (name === 'list_tables' || name === 'describe_tables') {
    return Array.isArray(data) ? count(data.length, 'table') : '';
  }
  if (name === 'get_relationships') {
    return Array.isArray(data) ? count(data.length, 'relationship') : '';
  }
  if (name === 'describe_table') {
    const columns = asRecord(data)?.columns;
    return Array.isArray(columns) ? count(columns.length, 'column') : '';
  }

  const rows = getRowCount(data);
  if (rows !== undefined) {
    return `${count(rows, 'row')}${asRecord(data)?.truncated === true ? ' (truncated)' : ''}`;
  }

  return '';
}

export interface CliObserverOptions {
  /** Print the full tool trace. Without it only the spinner shows progress. */
  verbose?: boolean;
  style?: Style;
  spinner?: Spinner;
  width?: number;
}

export class CliAgentObserver implements AgentObserver {
  private readonly verbose: boolean;
  private readonly style: Style;
  private readonly spinner?: Spinner;
  private readonly width: number;

  constructor(options: CliObserverOptions = {}) {
    this.verbose = options.verbose ?? true;
    this.style = options.style ?? createStyle(process.stderr);
    this.spinner = options.spinner;
    this.width = options.width ?? terminalWidth(process.stderr);
  }

  onToolEvent(event: AgentToolEvent): void {
    if (!this.verbose) {
      if (event.type === 'tool-start') {
        this.spinner?.update(SPINNER_LABELS[event.name] ?? 'Working');
      } else {
        this.spinner?.update('Thinking');
      }
      return;
    }

    // Emit the structured event before the human-readable diagnostic.
    emitStructuredEvent(event);

    this.spinner?.clear();

    if (this.style.rich) this.printRich(event);
    else this.printPlain(event);

    this.spinner?.update(event.type === 'tool-start' ? SPINNER_LABELS[event.name] ?? 'Working' : 'Thinking');
    this.spinner?.resume();
  }

  private printPlain(event: AgentToolEvent): void {
    if (event.type === 'tool-start') {
      console.error(`\n[tool] ${event.name}`);

      const input = formatInput(event.input);
      if (!input) return;

      if (
        typeof event.input === 'object' &&
        event.input !== null &&
        'sql' in event.input
      ) {
        console.error('[sql]');
        console.error(input);
      } else {
        console.error(`[input] ${input}`);
      }

      return;
    }

    if (event.success) {
      const rowCount = getRowCount(event.data);
      const rows =
        rowCount === undefined
          ? ''
          : `, ${rowCount} row${rowCount === 1 ? '' : 's'}`;

      console.error(
        `[done] ${event.name} (${event.durationMs}ms${rows})`,
      );

      if (event.name === 'submit_query_plan') {
        const data = asRecord(event.data);
        const max = data?.maxSubmissions;
        console.error(
          `[plan] accepted (submission ${String(data?.submission ?? '?')}${typeof max === 'number' ? ` of ${max}` : ''})`,
        );
        const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
        for (const warning of warnings) console.error(`[warn] ${String(warning)}`);
      }
    } else {
      console.error(
        `[error] ${event.name} (${event.durationMs}ms): ${
          event.error ?? 'Unknown error'
        }`,
      );
    }
  }

  private printRich(event: AgentToolEvent): void {
    const { style } = this;
    const room = Math.max(20, this.width - 6);

    if (event.type === 'tool-start') {
      console.error(`\n${style.cyan('▸')} ${style.bold(event.name)}`);

      if (event.name === 'submit_query_plan') {
        for (const [label, value] of describePlan(event.input)) {
          console.error(`  ${style.dim(label.padEnd(10))} ${truncateVisible(value, room - 10)}`);
        }
        return;
      }

      const record = asRecord(event.input);

      if (typeof record?.sql === 'string') {
        highlightSql(record.sql.trim(), style)
          .split('\n')
          .forEach((line) => console.error(`  ${style.dim('│')} ${line}`));
        return;
      }

      if (Array.isArray(record?.tables)) {
        console.error(`  ${style.dim(record.tables.join(', '))}`);
        return;
      }

      if (typeof record?.table === 'string') {
        console.error(`  ${style.dim(record.table)}`);
      }
      return;
    }

    if (!event.success) {
      console.error(`  ${style.red('✗')} ${style.red(event.error ?? 'Unknown error')} ${style.dim(`${event.durationMs}ms`)}`);
      return;
    }

    const data = asRecord(event.data);
    const detail = summarize(event.name, event.data);
    const parts = [`${event.durationMs}ms`, ...(detail ? [detail] : [])];

    if (event.name === 'submit_query_plan') {
      const max = data?.maxSubmissions;
      parts.unshift(
        `accepted ${String(data?.submission ?? '?')}${typeof max === 'number' ? `/${max}` : ''}`,
      );
    }

    console.error(`  ${style.green('✓')} ${style.dim(parts.join(' · '))}`);

    const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
    for (const warning of warnings) {
      console.error(`  ${style.yellow('⚠')} ${style.yellow(String(warning))}`);
    }
  }
}
