import { afterEach, describe, expect, it, vi } from 'vitest';
import { CliAgentObserver, describePlan } from '../src/cli-observer.js';
import { formatValidationReport } from '../src/commands/validate.js';
import { renderMarkdown } from '../src/ui/markdown.js';
import { highlightSql } from '../src/ui/sql-highlight.js';
import { Spinner } from '../src/ui/spinner.js';
import {
  createStyle,
  plainStyle,
  stripAnsi,
  truncateVisible,
  visibleLength,
} from '../src/ui/style.js';

const tty = createStyle({ isTTY: true }, { TERM: 'xterm' });

describe('createStyle', () => {
  it('is plain when output is not a terminal', () => {
    const s = createStyle({ isTTY: false }, {});
    expect([s.rich, s.color]).toEqual([false, false]);
    expect(s.red('x')).toBe('x');
  });

  it('uses color and rich output on a terminal', () => {
    expect([tty.rich, tty.color]).toEqual([true, true]);
    expect(tty.red('x')).toBe('\u001b[31mx\u001b[39m');
  });

  it('honours NO_COLOR but keeps symbols and boxes', () => {
    const s = createStyle({ isTTY: true }, { TERM: 'xterm', NO_COLOR: '1' });
    expect([s.rich, s.color]).toEqual([true, false]);
    expect(s.bold('x')).toBe('x');
  });

  it('honours FORCE_COLOR without making a pipe rich', () => {
    expect(createStyle({ isTTY: false }, { FORCE_COLOR: '1' })).toMatchObject({ rich: false, color: true });
    expect(createStyle({ isTTY: true }, { TERM: 'xterm', FORCE_COLOR: '0' }).color).toBe(false);
  });

  it('is plain on a dumb terminal', () => {
    expect(createStyle({ isTTY: true }, { TERM: 'dumb' }).rich).toBe(false);
  });
});

describe('truncateVisible', () => {
  it('counts characters, not escape codes', () => {
    const text = tty.bold('abcdefghij');
    expect(visibleLength(text)).toBe(10);
    expect(stripAnsi(truncateVisible(text, 5))).toBe('abcd…');
    expect(truncateVisible('short', 10)).toBe('short');
  });
});

describe('highlightSql', () => {
  const samples = [
    "SELECT c.id, COUNT(*) AS n FROM clients c WHERE c.name = 'it''s' -- note\nGROUP BY c.id",
    'SELECT `order` FROM "Order Items" WHERE x BETWEEN 1.5 AND 20',
    "SELECT 'FROM WHERE' AS text",
    '/* block */ SELECT 1',
  ];

  it.each(samples)('only adds color: %s', (sql) => {
    expect(stripAnsi(highlightSql(sql, tty))).toBe(sql);
  });

  it('leaves SQL untouched without color', () => {
    expect(highlightSql(samples[0]!, plainStyle)).toBe(samples[0]);
  });

  it('does not color keywords inside strings or quoted identifiers', () => {
    const out = highlightSql("SELECT 'FROM x' , `where`", tty);
    expect(out).toContain(tty.green("'FROM x'"));
    expect(out).toContain('`where`');
    expect(out).not.toContain(tty.magenta('where'));
  });
});

describe('renderMarkdown', () => {
  const md = [
    '## Title',
    '',
    'Some **bold** and `code` and *italic* text.',
    '',
    '| Client | Ref | Amount |',
    '| :--- | :--- | ---: |',
    '| **Charlie Imports Limited** | FX-20261015-PRG1 | 100,000.0000 |',
    '| Bravo | FX-20260609-IHBP | 0.0000 |',
    '',
    '- first',
    '- second',
    '',
    '```sql',
    'SELECT 1 FROM t',
    '```',
  ].join('\n');

  it('returns the Markdown unchanged when output is not a terminal', () => {
    expect(renderMarkdown(md, plainStyle, 80)).toBe(md);
    expect(renderMarkdown(md, createStyle({ isTTY: false }, { FORCE_COLOR: '1' }), 80)).toBe(md);
  });

  it('renders markers, bullets, headings and code for a terminal', () => {
    const out = stripAnsi(renderMarkdown(md, tty, 80));
    expect(out).toContain('Title');
    expect(out).not.toContain('##');
    expect(out).toContain('Some bold and code and italic text.');
    expect(out).toContain('• first');
    expect(out).toContain('│ SELECT 1 FROM t');
    expect(out).not.toContain('```');
  });

  it('draws tables with every line the same width, and fits the terminal', () => {
    for (const width of [80, 50, 38]) {
      const lines = stripAnsi(renderMarkdown(md, tty, width))
        .split('\n')
        .filter((line) => /^[┌├└│]/.test(line));

      expect(lines.length).toBeGreaterThan(4);
      expect(new Set(lines.map((line) => [...line].length)).size).toBe(1);
      expect([...(lines[0] ?? '')].length).toBeLessThanOrEqual(width);
    }
  });

  it('wraps long cells instead of cutting ids', () => {
    const out = stripAnsi(renderMarkdown(md, tty, 50));
    expect(out).toContain('FX-20261015-PRG1');
    expect(out).toContain('FX-20260609-IHBP');
    expect(out).toContain('100,000.0000');
  });

  it('closes bold on every wrapped line so styles do not bleed', () => {
    const lines = renderMarkdown(md, tty, 40).split('\n');
    for (const line of lines) {
      const opened = (line.match(/\u001b\[1m/g) ?? []).length;
      const closed = (line.match(/\u001b\[(22|0)m/g) ?? []).length;
      expect(closed).toBeGreaterThanOrEqual(opened);
    }
  });

  it('aligns numeric columns to the right', () => {
    const out = stripAnsi(renderMarkdown(md, tty, 80));
    expect(out).toMatch(/│\s+0\.0000 │/);
  });
});

describe('Spinner', () => {
  const stream = () => {
    const writes: string[] = [];
    return { isTTY: true, columns: 80, writes, write: (chunk: string) => writes.push(chunk) };
  };

  it('does nothing when output is not a terminal', () => {
    const s = { ...stream(), isTTY: false };
    const spinner = new Spinner(s, tty);
    spinner.start('Thinking');
    spinner.stop();
    expect(s.writes).toEqual([]);
  });

  it('hides the cursor while running and always restores it', () => {
    vi.useFakeTimers();
    const s = stream();
    const spinner = new Spinner(s, tty);
    spinner.start('Thinking');
    spinner.update('Running query');
    spinner.stop();

    const text = s.writes.join('');
    expect(text).toContain('\u001b[?25l');
    expect(text).toContain('Running query');
    expect(text.lastIndexOf('\u001b[?25h')).toBeGreaterThan(text.lastIndexOf('Running query'));
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it('stop is safe to call twice or before start', () => {
    const spinner = new Spinner(stream(), tty);
    expect(() => {
      spinner.stop();
      spinner.stop();
    }).not.toThrow();
  });
});

describe('CliAgentObserver', () => {
  afterEach(() => vi.restoreAllMocks());

  const capture = () => {
    const lines: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      lines.push(args.join(' '));
    });
    return lines;
  };

  const planEnd = (data: unknown) => ({
    type: 'tool-end' as const,
    name: 'submit_query_plan',
    input: {},
    success: true,
    durationMs: 5,
    data,
  });

  it('keeps the original plain format when output is not a terminal', () => {
    const lines = capture();
    const o = new CliAgentObserver({ style: plainStyle });

    o.onToolEvent({ type: 'tool-start', name: 'execute_query', input: { sql: 'SELECT 1' } });
    o.onToolEvent({
      type: 'tool-end', name: 'execute_query', input: {}, success: true, durationMs: 13,
      data: { rows: [1, 2], rowCount: 2 },
    });

    expect(lines).toEqual(['\n[tool] execute_query', '[sql]', 'SELECT 1', '[done] execute_query (13ms, 2 rows)']);
  });

  it('prints plan acceptance and warnings in plain mode', () => {
    const lines = capture();
    new CliAgentObserver({ style: plainStyle }).onToolEvent(
      planEnd({ accepted: true, submission: 1, maxSubmissions: 4, warnings: ['a.x = b.y is not a declared foreign key.'] }),
    );

    expect(lines).toContain('[plan] accepted (submission 1 of 4)');
    expect(lines).toContain('[warn] a.x = b.y is not a declared foreign key.');
  });

  it('shows rejection reasons', () => {
    const lines = capture();
    new CliAgentObserver({ style: plainStyle }).onToolEvent({
      type: 'tool-end', name: 'submit_query_plan', input: {}, success: false, durationMs: 2,
      error: 'Plan rejected: Unknown table: unicorns.',
    });
    expect(lines[0]).toBe('[error] submit_query_plan (2ms): Plan rejected: Unknown table: unicorns.');
  });

  it('uses symbols, summaries and warnings on a terminal', () => {
    const lines = capture();
    const o = new CliAgentObserver({ style: tty, width: 80 });
    o.onToolEvent(planEnd({ accepted: true, submission: 2, maxSubmissions: 4, warnings: ['careful'] }));
    o.onToolEvent({
      type: 'tool-end', name: 'list_tables', input: {}, success: true, durationMs: 9, data: [{}, {}, {}],
    });

    const text = stripAnsi(lines.join('\n'));
    expect(text).toContain('✓ accepted 2/4 · 5ms');
    expect(text).toContain('⚠ careful');
    expect(text).toContain('✓ 9ms · 3 tables');
  });

  it('prints nothing without verbose, and only moves the spinner', () => {
    const lines = capture();
    const spinner = { update: vi.fn(), clear: vi.fn(), resume: vi.fn() };
    const o = new CliAgentObserver({ verbose: false, style: tty, spinner: spinner as never });

    o.onToolEvent({ type: 'tool-start', name: 'execute_query', input: { sql: 'SELECT 1' } });
    o.onToolEvent({ type: 'tool-end', name: 'execute_query', input: {}, success: true, durationMs: 1 });

    expect(lines).toEqual([]);
    expect(spinner.update).toHaveBeenNthCalledWith(1, 'Running query');
    expect(spinner.update).toHaveBeenNthCalledWith(2, 'Thinking');
  });

  it('describes plans, including ones in an older shape', () => {
    expect(
      describePlan({
        objective: 'o',
        tables: ['a', 'b'],
        fields: [{ table: 'a', column: 'x' }],
        joins: [{ left: { table: 'b', column: 'a_id' }, right: { table: 'a', column: 'id' } }],
        filters: ['x > 1'],
      }),
    ).toEqual([
      ['objective', 'o'],
      ['tables', 'a, b'],
      ['fields', 'a.x'],
      ['joins', 'b.a_id = a.id'],
      ['filters', 'x > 1'],
    ]);

    expect(describePlan({ tables: ['a'], requiredFields: ['x'], joins: ['JOIN b ON 1=1'] })).toEqual([
      ['tables', 'a'],
      ['joins', 'JOIN b ON 1=1'],
    ]);
    expect(describePlan('nonsense')).toEqual([]);
  });
});

describe('validation report styling', () => {
  const results = [
    { name: 'Configuration', status: 'pass' as const, detail: 'ok' },
    { name: 'Foreign keys', status: 'warn' as const, detail: 'none' },
    { name: 'Database connection', status: 'fail' as const, detail: 'refused' },
  ];

  it('keeps the bracket format by default', () => {
    expect(formatValidationReport(results)).toContain('[ok]   Configuration: ok');
  });

  it('uses symbols on a terminal', () => {
    const text = stripAnsi(formatValidationReport(results, tty));
    expect(text).toContain('✓ Configuration: ok');
    expect(text).toContain('⚠ Foreign keys: none');
    expect(text).toContain('✗ Database connection: refused');
    expect(text).toContain('Fix the items marked ✗');
  });
});
