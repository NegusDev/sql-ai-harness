/**
 * Terminal styling with no dependencies.
 *
 * Two separate switches:
 * - `rich`: the stream is an interactive terminal, so box drawing, symbols and
 *   spinners are fine. Piped or redirected output is never rich.
 * - `color`: ANSI colors are on. Follows NO_COLOR / FORCE_COLOR.
 */
export interface StyleStream {
  isTTY?: boolean;
}

export interface Style {
  rich: boolean;
  color: boolean;
  bold(text: string): string;
  dim(text: string): string;
  italic(text: string): string;
  underline(text: string): string;
  red(text: string): string;
  green(text: string): string;
  yellow(text: string): string;
  magenta(text: string): string;
  cyan(text: string): string;
}

type Env = Record<string, string | undefined>;

const ESC = '\u001b[';
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g;

function wrap(open: number, close: number): (text: string) => string {
  return (text) => `${ESC}${open}m${text}${ESC}${close}m`;
}

const identity = (text: string): string => text;

export function createStyle(stream: StyleStream, env: Env = process.env): Style {
  const rich = Boolean(stream.isTTY) && env.TERM !== 'dumb';

  const force = env.FORCE_COLOR;
  const forcedOff = force === '0' || force === 'false';
  const forcedOn = force !== undefined && force !== '' && !forcedOff;
  const noColor = env.NO_COLOR !== undefined && env.NO_COLOR !== '';

  const color = forcedOff ? false : forcedOn ? true : rich && !noColor;
  const on = (open: number, close: number) => (color ? wrap(open, close) : identity);

  return {
    rich,
    color,
    bold: on(1, 22),
    dim: on(2, 22),
    italic: on(3, 23),
    underline: on(4, 24),
    red: on(31, 39),
    green: on(32, 39),
    yellow: on(33, 39),
    magenta: on(35, 39),
    cyan: on(36, 39),
  };
}

/** A style that adds nothing: used for tests and non-terminal output. */
export const plainStyle: Style = createStyle({ isTTY: false }, {});

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

/** Length as seen on screen: ANSI sequences take no space. */
export function visibleLength(text: string): number {
  return [...stripAnsi(text)].length;
}

/** Cuts `text` to `max` visible characters, keeping ANSI sequences intact. */
export function truncateVisible(text: string, max: number): string {
  if (visibleLength(text) <= max) return text;
  if (max <= 1) return max === 1 ? '…' : '';

  let out = '';
  let seen = 0;
  let i = 0;

  while (i < text.length && seen < max - 1) {
    if (text[i] === '\u001b') {
      const match = /^\u001b\[[0-9;?]*[A-Za-z]/.exec(text.slice(i));
      if (match) {
        out += match[0];
        i += match[0].length;
        continue;
      }
    }

    const char = String.fromCodePoint(text.codePointAt(i) ?? 0);
    out += char;
    i += char.length;
    seen += 1;
  }

  // Close anything still open so the cut does not bleed into later text.
  return `${out}…${text.includes(ESC) ? `${ESC}0m` : ''}`;
}

export function terminalWidth(stream: { columns?: number }, fallback = 80): number {
  const columns = stream.columns;
  return typeof columns === 'number' && columns > 20 ? columns : fallback;
}
