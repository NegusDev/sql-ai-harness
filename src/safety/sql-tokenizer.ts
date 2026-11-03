/**
 * Minimal MySQL/MariaDB-aware SQL tokenizer used by the safety validator.
 *
 * It is not a full SQL parser. Its only job is to separate the parts of a
 * statement that carry meaning (keywords, identifiers, punctuation) from the
 * parts that do not (string literals, quoted identifiers, comments), so safety
 * rules are applied to real SQL tokens instead of raw text.
 *
 * Assumptions, matching MySQL defaults:
 * - backslash escapes are active inside quoted strings (no NO_BACKSLASH_ESCAPES)
 * - double quotes delimit strings, not identifiers (no ANSI_QUOTES)
 *
 * Executable comments (`/*! ... *\/` and MariaDB's `/*M! ... *\/`) are rejected
 * outright because the server executes their contents.
 */

export type SqlTokenType = 'word' | 'string' | 'quoted-identifier' | 'punct';

export interface SqlToken {
  type: SqlTokenType;
  /** Upper-cased for words; raw text for everything else. */
  value: string;
  /** Offset of the first character in the original SQL. */
  start: number;
  /** Offset one past the last character in the original SQL. */
  end: number;
}

export interface TokenizeResult {
  tokens: SqlToken[];
  error?: string;
}

const WORD_CHAR = /[A-Za-z0-9_$\u0080-￿]/;

export function tokenizeSql(sql: string): TokenizeResult {
  const tokens: SqlToken[] = [];
  const n = sql.length;
  let i = 0;

  while (i < n) {
    const c = sql[i] as string;
    const next = sql[i + 1];

    // Whitespace.
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }

    // `-- ` line comment. MySQL requires whitespace or a control character
    // after the two dashes; `--x` is two minus signs, not a comment.
    if (c === '-' && next === '-') {
      const after = sql[i + 2];
      if (after === undefined || /[\s\u0000-\u001f]/.test(after)) {
        const eol = sql.indexOf('\n', i + 2);
        i = eol === -1 ? n : eol + 1;
        continue;
      }
    }

    // `#` line comment.
    if (c === '#') {
      const eol = sql.indexOf('\n', i + 1);
      i = eol === -1 ? n : eol + 1;
      continue;
    }

    // Block comment.
    if (c === '/' && next === '*') {
      if (sql[i + 2] === '!' || (sql[i + 2] === 'M' && sql[i + 3] === '!')) {
        return {
          tokens,
          error: 'Executable comments (/*! ... */) are not allowed.',
        };
      }

      const close = sql.indexOf('*/', i + 2);
      if (close === -1) {
        return { tokens, error: 'The query contains an unterminated comment.' };
      }

      i = close + 2;
      continue;
    }

    // Quoted strings: '...' and "...".
    if (c === "'" || c === '"') {
      const start = i;
      let j = i + 1;
      let closed = false;

      while (j < n) {
        const d = sql[j] as string;

        if (d === '\\') {
          j += 2;
          continue;
        }

        if (d === c) {
          if (sql[j + 1] === c) {
            j += 2;
            continue;
          }
          closed = true;
          j += 1;
          break;
        }

        j += 1;
      }

      if (!closed) {
        return { tokens, error: 'The query contains an unterminated string.' };
      }

      tokens.push({ type: 'string', value: sql.slice(start, j), start, end: j });
      i = j;
      continue;
    }

    // Backtick-quoted identifiers.
    if (c === '`') {
      const start = i;
      let j = i + 1;
      let closed = false;

      while (j < n) {
        if (sql[j] === '`') {
          if (sql[j + 1] === '`') {
            j += 2;
            continue;
          }
          closed = true;
          j += 1;
          break;
        }
        j += 1;
      }

      if (!closed) {
        return {
          tokens,
          error: 'The query contains an unterminated quoted identifier.',
        };
      }

      tokens.push({
        type: 'quoted-identifier',
        value: sql.slice(start, j),
        start,
        end: j,
      });
      i = j;
      continue;
    }

    // Words: keywords, identifiers, and numbers.
    if (WORD_CHAR.test(c)) {
      const start = i;
      let j = i + 1;
      while (j < n && WORD_CHAR.test(sql[j] as string)) j += 1;

      tokens.push({
        type: 'word',
        value: sql.slice(start, j).toUpperCase(),
        start,
        end: j,
      });
      i = j;
      continue;
    }

    // Everything else is single-character punctuation.
    tokens.push({ type: 'punct', value: c, start: i, end: i + 1 });
    i += 1;
  }

  return { tokens };
}
