
import process from 'node:process';
import type {
  AgentObserver,
  AgentToolEvent,
} from './core/agent/observability.js';

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
        source: 'sql-ai-harness',
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
        source: 'sql-ai-harness',
        type: 'trace-serialization-error',
        message:
          error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export class CliAgentObserver implements AgentObserver {
  onToolEvent(event: AgentToolEvent): void {
    // Emit the structured event before the human-readable diagnostic.
    emitStructuredEvent(event);

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
    } else {
      console.error(
        `[error] ${event.name} (${event.durationMs}ms): ${
          event.error ?? 'Unknown error'
        }`,
      );
    }
  }
}
