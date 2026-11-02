import type { SqlSafetyPolicy } from '../core/types/index.js';
import { tokenizeSql, type SqlToken } from './sql-tokenizer.js';

/** Statements the harness is willing to send to the database at all. */
const ALLOWED_FIRST_KEYWORDS = new Set([
  'SELECT',
  'WITH',
  'EXPLAIN',
  'SHOW',
  'DESCRIBE',
  'DESC',
]);

/** Keywords that must not appear anywhere in a read-only query. */
const BLOCKED_KEYWORDS = new Set([
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'MERGE',
  'GRANT',
  'REVOKE',
  'CALL',
  'SET',
  'USE',
  'LOAD',
  'HANDLER',
  'LOCK',
  'UNLOCK',
  'PREPARE',
  'EXECUTE',
  'DEALLOCATE',
  'RENAME',
  'KILL',
  'FLUSH',
  // Writes query output to the server filesystem or into variables.
  'INTO',
]);

/**
 * INSERT(), REPLACE() and TRUNCATE() are also ordinary string/math functions.
 * They are only treated as the statement keywords when they are not
 * immediately followed by an opening parenthesis.
 */
const FUNCTION_LIKE_KEYWORDS = new Set(['INSERT', 'REPLACE', 'TRUNCATE']);

/**
 * Functions that read server files, block, take locks, or are commonly used
 * to tie up a connection. Blocked whenever they are called.
 */
const BLOCKED_FUNCTIONS = new Set([
  'LOAD_FILE',
  'SLEEP',
  'BENCHMARK',
  'GET_LOCK',
  'RELEASE_LOCK',
  'RELEASE_ALL_LOCKS',
  'IS_FREE_LOCK',
  'IS_USED_LOCK',
  'MASTER_POS_WAIT',
  'SOURCE_POS_WAIT',
  'WAIT_FOR_EXECUTED_GTID_SET',
  'WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS',
]);

export interface SqlValidationResult {
  valid: boolean;
  sql?: string;
  reason?: string;
}

function isPunct(token: SqlToken | undefined, value: string): boolean {
  return token?.type === 'punct' && token.value === value;
}

/**
 * First-stage SQL safety boundary.
 *
 * The SQL is tokenized so string literals, quoted identifiers, and comments
 * are never mistaken for SQL, then these rules are applied:
 *
 * - exactly one statement (a single trailing semicolon is accepted)
 * - the statement must start with a read-oriented keyword
 * - executable comments are rejected
 * - when `policy.readOnly` is set: write/DDL/locking keywords, `INTO`, and
 *   `FOR SHARE` / `FOR UPDATE` are rejected
 * - functions that read files or block the connection (SLEEP, LOAD_FILE, ...)
 *   are rejected
 *
 * This is not a complete SQL parser and assumes MySQL's default sql_mode
 * (backslash escapes on, ANSI_QUOTES off). User-defined functions cannot be
 * recognized as side-effecting. The database account must still be read-only.
 */
export function validateSql(sql: string, policy: SqlSafetyPolicy): SqlValidationResult {
  const normalized = sql.trim();

  if (!normalized) {
    return { valid: false, reason: 'SQL query is empty.' };
  }

  const { tokens: allTokens, error } = tokenizeSql(normalized);

  if (error) {
    return { valid: false, reason: error };
  }

  // Split on the first semicolon outside strings, quoted identifiers, and
  // comments. Anything after it, other than comments, is a second statement.
  let tokens = allTokens;
  let output = normalized;
  const semicolon = allTokens.findIndex((token) => isPunct(token, ';'));

  if (semicolon !== -1) {
    if (semicolon < allTokens.length - 1) {
      return { valid: false, reason: 'Multiple SQL statements are not allowed.' };
    }

    tokens = allTokens.slice(0, semicolon);
    output = normalized.slice(0, (allTokens[semicolon] as SqlToken).start).trimEnd();
  }

  if (tokens.length === 0) {
    return { valid: false, reason: 'SQL query is empty.' };
  }

  // Allow leading parentheses, e.g. (SELECT ...) UNION (SELECT ...).
  let first = 0;
  while (isPunct(tokens[first], '(')) first += 1;

  const head = tokens[first];
  if (
    !head ||
    head.type !== 'word' ||
    !ALLOWED_FIRST_KEYWORDS.has(head.value)
  ) {
    return { valid: false, reason: 'Only read-oriented SQL statements are allowed.' };
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] as SqlToken;
    if (token.type !== 'word') continue;

    // A word after a dot is part of a qualified name (t.update), not a keyword.
    if (isPunct(tokens[index - 1], '.')) continue;

    const following = tokens[index + 1];
    const isCall = isPunct(following, '(');

    if (BLOCKED_FUNCTIONS.has(token.value) && isCall) {
      return {
        valid: false,
        reason: `The function ${token.value}() is not allowed.`,
      };
    }

    if (!policy.readOnly) continue;

    if (BLOCKED_KEYWORDS.has(token.value)) {
      if (FUNCTION_LIKE_KEYWORDS.has(token.value) && isCall) continue;

      // CHARACTER SET utf8 (in CAST/CONVERT, SHOW CHARACTER SET).
      if (token.value === 'SET' && tokens[index - 1]?.value === 'CHARACTER') continue;

      // Index hints: USE INDEX (...) / USE KEY (...).
      if (
        token.value === 'USE' &&
        following?.type === 'word' &&
        (following.value === 'INDEX' || following.value === 'KEY')
      ) {
        continue;
      }

      return {
        valid: false,
        reason: `The query contains a blocked SQL operation (${token.value}).`,
      };
    }

    if (
      token.value === 'FOR' &&
      following?.type === 'word' &&
      (following.value === 'SHARE' || following.value === 'UPDATE')
    ) {
      return {
        valid: false,
        reason: 'Locking reads (FOR SHARE / FOR UPDATE) are not allowed.',
      };
    }
  }

  return { valid: true, sql: output };
}
