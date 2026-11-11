import { highlightSql } from './sql-highlight.js';
import { truncateVisible, visibleLength, type Style } from './style.js';

type Align = 'left' | 'right' | 'center';

function inline(text: string, style: Style): string {
  return text
    .split(/(`[^`]+`)/g)
    .map((part) => {
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return style.cyan(part.slice(1, -1));
      }

      return part
        .replace(/\*\*([^*\n]+?)\*\*/g, (_m, body: string) => style.bold(body))
        .replace(/(?<![*\w])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![*\w])/g, (_m, body: string) => style.italic(body));
    })
    .join('');
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

const SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function isTableStart(lines: string[], index: number): boolean {
  const head = lines[index] ?? '';
  const sep = lines[index + 1] ?? '';
  return head.includes('|') && SEPARATOR.test(sep) && sep.includes('-');
}

function alignOf(cell: string): Align {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'center';
  return right ? 'right' : 'left';
}

function pad(text: string, width: number, align: Align): string {
  const gap = Math.max(0, width - visibleLength(text));
  if (align === 'right') return ' '.repeat(gap) + text;
  if (align === 'center') {
    const left = Math.floor(gap / 2);
    return ' '.repeat(left) + text + ' '.repeat(gap - left);
  }
  return text + ' '.repeat(gap);
}

const SGR = /\u001b\[([0-9;]*)m/g;

/** Open styles at the end of `text`, so a wrapped line can close and reopen them. */
function openStyles(text: string): string[] {
  const open = new Map<string, string>();
  const closes: Record<string, string> = { '22': '1,2', '23': '3', '24': '4', '39': '31,32,33,35,36' };

  for (const match of text.matchAll(SGR)) {
    const code = match[1] ?? '';
    if (code === '0' || code === '') open.clear();
    else if (closes[code]) closes[code]!.split(',').forEach((c) => open.delete(c));
    else open.set(code, `\u001b[${code}m`);
  }

  return [...open.values()];
}

/** Word-wraps styled text to `width`, keeping styles correct on every line. */
function wrapStyled(text: string, width: number): string[] {
  if (visibleLength(text) <= width) return [text];

  const lines: string[] = [];
  let current = '';

  for (const word of text.split(' ')) {
    const candidate = current ? `${current} ${word}` : word;
    if (visibleLength(candidate) <= width) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = visibleLength(word) > width ? truncateVisible(word, width) : word;
  }

  if (current) lines.push(current);

  // Close styles at the end of a line and reopen them on the next.
  let carry: string[] = [];
  return lines.map((line) => {
    const prefix = carry.join('');
    const full = prefix + line;
    carry = openStyles(full);
    return carry.length ? `${full}\u001b[0m` : full;
  });
}

function renderTable(rows: string[][], aligns: Align[], style: Style, maxWidth: number): string[] {
  const columns = Math.max(...rows.map((row) => row.length));
  const cells = rows.map((row, r) =>
    Array.from({ length: columns }, (_, c) => {
      const text = inline(row[c] ?? '', style);
      return r === 0 ? style.bold(text) : text;
    }),
  );

  const widths = Array.from({ length: columns }, (_, c) =>
    Math.max(1, ...cells.map((row) => visibleLength(row[c] ?? ''))),
  );

  // A column can shrink until its longest unbreakable word (an id, a date).
  const floors = Array.from({ length: columns }, (_, c) =>
    Math.max(
      3,
      ...cells.map((row) => Math.max(1, ...stripWords(row[c] ?? '').map((word) => visibleLength(word)))),
    ),
  );

  // Borders and padding take 3 characters per column plus 1.
  const overhead = columns * 3 + 1;
  const total = (): number => widths.reduce((a, b) => a + b, 0) + overhead;

  while (total() > maxWidth) {
    let target = -1;
    for (let c = 0; c < columns; c += 1) {
      if ((widths[c] ?? 0) > (floors[c] ?? 0) && (target === -1 || (widths[c] ?? 0) > (widths[target] ?? 0))) {
        target = c;
      }
    }
    if (target === -1) break;
    widths[target] = (widths[target] ?? 0) - 1;
  }

  // Still too wide: cut the widest columns down, truncating their text.
  while (total() > maxWidth) {
    const widest = widths.indexOf(Math.max(...widths));
    if ((widths[widest] ?? 0) <= 4) break;
    widths[widest] = (widths[widest] ?? 0) - 1;
  }

  const rule = (left: string, mid: string, right: string): string =>
    style.dim(left + widths.map((w) => '─'.repeat(w + 2)).join(mid) + right);

  const physical = (row: string[]): string[] => {
    const wrapped = row.map((cell, c) => wrapStyled(cell, widths[c] ?? 1));
    const height = Math.max(...wrapped.map((lines) => lines.length));

    return Array.from({ length: height }, (_, i) =>
      style.dim('│') +
      wrapped
        .map((lines, c) => ` ${pad(truncateVisible(lines[i] ?? '', widths[c] ?? 1), widths[c] ?? 1, aligns[c] ?? 'left')} `)
        .join(style.dim('│')) +
      style.dim('│'),
    );
  };

  const body = cells.slice(1).map(physical);
  const separated = body.some((lines) => lines.length > 1);

  const out = [rule('┌', '┬', '┐'), ...physical(cells[0] ?? []), rule('├', '┼', '┤')];
  body.forEach((lines, i) => {
    out.push(...lines);
    if (separated && i < body.length - 1) out.push(rule('├', '┼', '┤'));
  });
  out.push(rule('└', '┴', '┘'));
  return out;
}

function stripWords(text: string): string[] {
  return text.split(' ').filter(Boolean);
}

/**
 * Renders the Markdown a model typically writes (headings, bold, code, lists,
 * tables) for a terminal. Output that is not an interactive terminal is
 * returned untouched, so pipes and files keep the original Markdown.
 */
export function renderMarkdown(text: string, style: Style, width = 80): string {
  if (!style.rich) return text;

  const lines = text.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? '';

    // Fenced code block.
    const fence = /^\s*```\s*([A-Za-z]*)\s*$/.exec(raw);
    if (fence) {
      const language = (fence[1] ?? '').toLowerCase();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i] ?? '')) {
        body.push(lines[i] ?? '');
        i += 1;
      }

      const code = body.join('\n');
      const shown = language === 'sql' || language === '' ? highlightSql(code, style) : code;
      shown.split('\n').forEach((codeLine) => out.push(`  ${style.dim('│')} ${codeLine}`));
      continue;
    }

    // Table.
    if (isTableStart(lines, i)) {
      const aligns = splitRow(lines[i + 1] ?? '').map(alignOf);
      const rows = [splitRow(raw)];
      i += 2;
      while (i < lines.length && (lines[i] ?? '').includes('|') && (lines[i] ?? '').trim() !== '') {
        rows.push(splitRow(lines[i] ?? ''));
        i += 1;
      }
      i -= 1;
      out.push(...renderTable(rows, aligns, style, width));
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(raw);
    if (heading) {
      const level = (heading[1] ?? '#').length;
      const title = inline(heading[2] ?? '', style);
      out.push(level <= 2 ? style.bold(style.cyan(title)) : style.bold(title));
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(raw)) {
      out.push(style.dim('─'.repeat(Math.min(width, 60))));
      continue;
    }

    const bullet = /^(\s*)[-*+]\s+(.*)$/.exec(raw);
    if (bullet) {
      out.push(`${bullet[1] ?? ''}${style.cyan('•')} ${inline(bullet[2] ?? '', style)}`);
      continue;
    }

    const quote = /^\s*>\s?(.*)$/.exec(raw);
    if (quote) {
      out.push(`${style.dim('▎')} ${style.italic(inline(quote[1] ?? '', style))}`);
      continue;
    }

    out.push(inline(raw, style));
  }

  return out.join('\n');
}
