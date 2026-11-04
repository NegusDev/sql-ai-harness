/**
 * Minimal SQL tokenizer used by the safety validator. It understands the
 * lexical rules of MySQL/MariaDB and PostgreSQL.
 *
 * It is not a full SQL parser. Its only job is to separate the parts of a
 * statement that carry meaning (keywords, identifiers, punctuation) from the
 * parts that do not (string literals, quoted identifiers, comments), so safety
 * rules are applied to real SQL tokens instead of raw text. Getting the lexical
 * rules of the *target* database exactly right matters: if this tokenizer and
 * the server disagree about where a string or comment ends, a second statement
 * can hide inside what the validator thinks is a literal.
 *
 * MySQL/MariaDB (defaults assumed):
 * - `-- ` and `#` line comments, non-nested block comments
 * - backslash escapes inside '...' and "..." strings (no NO_BACKSLASH_ESCAPES)
 * - double quotes delimit strings, not identifiers (no ANSI_QUOTES)
 * - executable comments (`/*! ... *\/`, `/*M! ... *\/`) are rejected outright
 *   because the server executes their contents
 *
 * PostgreSQL:
 * - `--` line comments (no whitespace needed); `#` is an operator, not a comment
 * - nested block comments
 * - '...' strings only escape quotes by doubling; backslash escapes apply only
 *   to E'...' strings (the adapter pins standard_conforming_strings = on)
 * - "..." delimits identifiers
 * - dollar-quoted strings ($$...$$ and $tag$...$tag$)
 * - U&'...' and U&"..." are rejected: their escapes can spell any name
 */

import type { SqlDialect } from '../core/types/index.js';

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
const DOLLAR_TAG = /\$(?:[A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/y;

/**
 * Tokenizes SQL using the lexical rules of `dialect`. Dialects other than
 * PostgreSQL use the MySQL rules (no other adapter exists yet).
 */
export function tokenizeSql(sql: string, dialect: SqlDialect = 'mysql'): TokenizeResult {
  const pg = dialect === 'postgres';
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

    // `--` line comment. PostgreSQL always treats `--` as a comment. MySQL
    // requires whitespace or a control character after the two dashes; `--x`
    // is two minus signs there, not a comment.
    if (c === '-' && next === '-') {
      const after = sql[i + 2];
      if (pg || after === undefined || /[\s\u0000-\u001f]/.test(after)) {
        const eol = sql.indexOf('\n', i + 2);
        i = eol === -1 ? n : eol + 1;
        continue;
      }
    }

    // `#` line comment (MySQL only; in PostgreSQL `#` starts operators like #>).
    if (c === '#' && !pg) {
      const eol = sql.indexOf('\n', i + 1);
      i = eol === -1 ? n : eol + 1;
      continue;
    }

    // Block comment.
    if (c === '/' && next === '*') {
      if (!pg && (sql[i + 2] === '!' || (sql[i + 2] === 'M' && sql[i + 3] === '!'))) {
        return {
          tokens,
          error: 'Executable comments (/*! ... */) are not allowed.',
        };
      }

      if (pg) {
        // PostgreSQL block comments nest.
        let depth = 1;
        let j = i + 2;

        while (j < n && depth > 0) {
          if (sql[j] === '/' && sql[j + 1] === '*') {
            depth += 1;
            j += 2;
          } else if (sql[j] === '*' && sql[j + 1] === '/') {
            depth -= 1;
            j += 2;
          } else {
            j += 1;
          }
        }

        if (depth > 0) {
          return { tokens, error: 'The query contains an unterminated comment.' };
        }

        i = j;
        continue;
      }

      const close = sql.indexOf('*/', i + 2);
      if (close === -1) {
        return { tokens, error: 'The query contains an unterminated comment.' };
      }

      i = close + 2;
      continue;
    }

    // PostgreSQL dollar-quoted strings: $$...$$ or $tag$...$tag$.
    // `$1` is a parameter placeholder and falls through to the word rule.
    if (pg && c === '$') {
      DOLLAR_TAG.lastIndex = i;
      const match = DOLLAR_TAG.exec(sql);

      if (match) {
        const tag = match[0];
        const close = sql.indexOf(tag, i + tag.length);

        if (close === -1) {
          return { tokens, error: 'The query contains an unterminated dollar-quoted string.' };
        }

        const end = close + tag.length;
        tokens.push({ type: 'string', value: sql.slice(i, end), start: i, end });
        i = end;
        continue;
      }
    }

    // Quoted strings ('...', and "..." in MySQL) and, in PostgreSQL,
    // double-quoted identifiers.
    if (c === "'" || c === '"') {
      const start = i;

      if (pg) {
        const previous = tokens[tokens.length - 1];
        const beforePrevious = tokens[tokens.length - 2];

        // U&'...' / U&"..." (Unicode escapes can spell any identifier).
        if (
          previous?.type === 'punct' &&
          previous.value === '&' &&
          previous.end === i &&
          beforePrevious?.type === 'word' &&
          beforePrevious.value === 'U' &&
          beforePrevious.end === previous.start
        ) {
          return {
            tokens,
            error: 'Unicode escape strings and identifiers (U&"...") are not allowed.',
          };
        }
      }

      // E'...' strings treat backslash as an escape character.
      let backslashEscapes = !pg;
      let tokenStart = start;

      if (pg && c === "'") {
        const previous = tokens[tokens.length - 1];
        if (previous?.type === 'word' && previous.value === 'E' && previous.end === i) {
          backslashEscapes = true;
          tokenStart = previous.start;
          tokens.pop();
        }
      }

      let j = i + 1;
      let closed = false;

      while (j < n) {
        const d = sql[j] as string;

        if (backslashEscapes && d === '\\') {
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
        return {
          tokens,
          error: pg && c === '"'
            ? 'The query contains an unterminated quoted identifier.'
            : 'The query contains an unterminated string.',
        };
      }

      tokens.push({
        type: pg && c === '"' ? 'quoted-identifier' : 'string',
        value: sql.slice(tokenStart, j),
        start: tokenStart,
        end: j,
      });
      i = j;
      continue;
    }

    // Backtick-quoted identifiers (MySQL only).
    if (c === '`' && !pg) {
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
