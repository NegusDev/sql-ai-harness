import type { SqlDialect, SqlSafetyPolicy } from '../core/types/index.js';
import { tokenizeSql, type SqlToken } from './sql-tokenizer.js';

/** Dialect-specific rules. Everything else in the validator is shared. */
interface DialectRules {
  /** Statements the harness is willing to send to the database at all. */
  allowedFirstKeywords: Set<string>;
  /** Keywords that must not appear anywhere in a read-only query. */
  blockedKeywords: Set<string>;
  /**
   * Keywords that are also ordinary functions. They are only treated as the
   * statement keyword when not immediately followed by an opening parenthesis.
   */
  functionLikeKeywords: Set<string>;
  /** Functions blocked by exact name (upper-case). */
  blockedFunctions: Set<string>;
  /** Functions blocked by name prefix (upper-case). */
  blockedFunctionPrefixes: string[];
  /** Words that, after FOR, start a locking clause. */
  lockingWords: Set<string>;
}

const MYSQL_RULES: DialectRules = {
  allowedFirstKeywords: new Set(['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC']),
  blockedKeywords: new Set([
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
  ]),
  // INSERT(), REPLACE() and TRUNCATE() are also ordinary string/math functions.
  functionLikeKeywords: new Set(['INSERT', 'REPLACE', 'TRUNCATE']),
  // Functions that read server files, block, take locks, or are commonly used
  // to tie up a connection.
  blockedFunctions: new Set([
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
  ]),
  blockedFunctionPrefixes: [],
  lockingWords: new Set(['SHARE', 'UPDATE']),
};

/**
 * PostgreSQL. Only words that can occur *inside* a single SELECT/WITH/EXPLAIN/
 * SHOW statement matter here: the statement-starting rule already rejects
 * everything else (COPY, DO, VACUUM, LOCK, ...). Words that are common column
 * names (LOAD, LOCK, USE, KILL, ...) are deliberately not blocked.
 */
const POSTGRES_RULES: DialectRules = {
  allowedFirstKeywords: new Set(['SELECT', 'WITH', 'EXPLAIN', 'SHOW']),
  blockedKeywords: new Set([
    // Data-modifying CTEs and statements nested in EXPLAIN.
    'INSERT',
    'UPDATE',
    'DELETE',
    'MERGE',
    'CREATE',
    'DROP',
    'ALTER',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
    'CALL',
    'SET',
    'COPY',
    'DO',
    'PREPARE',
    'EXECUTE',
    'DEALLOCATE',
    // SELECT ... INTO creates a table.
    'INTO',
  ]),
  functionLikeKeywords: new Set(),
  blockedFunctions: new Set([
    // Block the connection or change the session's safety settings.
    'PG_SLEEP',
    'PG_SLEEP_FOR',
    'PG_SLEEP_UNTIL',
    'SET_CONFIG',
    // Sequences are state.
    'NEXTVAL',
    'SETVAL',
    // Notifications and backend control.
    'PG_NOTIFY',
    'PG_TERMINATE_BACKEND',
    'PG_CANCEL_BACKEND',
    'PG_RELOAD_CONF',
    'PG_ROTATE_LOGFILE',
    'PG_SWITCH_WAL',
    'PG_PROMOTE',
    'PG_IMPORT_SYSTEM_COLLATIONS',
    // Read server files.
    'PG_STAT_FILE',
    // Server-side dynamic SQL: runs query text that the validator never sees.
    'QUERY_TO_XML',
    'QUERY_TO_XML_AND_XMLSCHEMA',
    'QUERY_TO_XMLSCHEMA',
    'CURSOR_TO_XML',
    'CURSOR_TO_XMLSCHEMA',
  ]),
  blockedFunctionPrefixes: [
    'PG_LS_', // pg_ls_dir, pg_ls_logdir, ...
    'PG_READ_', // pg_read_file, pg_read_binary_file
    'PG_FILE_',
    'PG_ADVISORY_', // pg_advisory_lock*, pg_advisory_unlock*, pg_advisory_xact_lock*
    'PG_TRY_ADVISORY_',
    'PG_CREATE_', // replication slots, restore points
    'PG_DROP_',
    'PG_REPLICATION_',
    'PG_LOGICAL_',
    'PG_COPY_',
    'PG_BACKUP_',
    'PG_WAL_REPLAY_',
    'LO_', // large objects: lo_import / lo_export touch the server filesystem
    'DBLINK', // other databases, arbitrary remote SQL
  ],
  lockingWords: new Set(['SHARE', 'UPDATE', 'NO', 'KEY']),
};

function rulesFor(dialect: SqlDialect): DialectRules {
  // Dialects without an adapter yet fall back to the MySQL rules.
  return dialect === 'postgres' ? POSTGRES_RULES : MYSQL_RULES;
}

export interface SqlValidationResult {
  valid: boolean;
  sql?: string;
  reason?: string;
}

function isPunct(token: SqlToken | undefined, value: string): boolean {
  return token?.type === 'punct' && token.value === value;
}

/**
 * Upper-cased function name when `token` is a (possibly quoted) identifier,
 * otherwise undefined. Quoted identifiers are unquoted first so that
 * "pg_sleep"(10) cannot hide a blocked function.
 */
function identifierName(token: SqlToken): string | undefined {
  if (token.type === 'word') return token.value;

  if (token.type === 'quoted-identifier') {
    const quote = token.value[0] as string;
    const inner = token.value.slice(1, -1).split(quote + quote).join(quote);
    return inner.toUpperCase();
  }

  return undefined;
}

function isBlockedFunction(name: string, rules: DialectRules): boolean {
  return (
    rules.blockedFunctions.has(name) ||
    rules.blockedFunctionPrefixes.some((prefix) => name.startsWith(prefix))
  );
}

/**
 * First-stage SQL safety boundary.
 *
 * The SQL is tokenized with the target dialect's lexical rules so string
 * literals, quoted identifiers, and comments are never mistaken for SQL, then
 * these rules are applied:
 *
 * - exactly one statement (a single trailing semicolon is accepted)
 * - the statement must start with a read-oriented keyword
 * - executable comments (MySQL) and Unicode-escaped names (PostgreSQL) are
 *   rejected
 * - when `policy.readOnly` is set: write/DDL/locking keywords, `INTO`, and
 *   locking reads (`FOR SHARE` / `FOR UPDATE`, ...) are rejected
 * - functions that read files, block the connection, take locks, or run
 *   dynamic SQL are rejected wherever they appear, including schema-qualified
 *   (`pg_catalog.pg_sleep(...)`) and quoted (`"pg_sleep"(...)`) forms
 *
 * This is not a complete SQL parser. MySQL rules assume the default sql_mode
 * (backslash escapes on, ANSI_QUOTES off); PostgreSQL rules assume
 * standard_conforming_strings = on, which the PostgreSQL adapter enforces.
 * User-defined functions cannot be recognized as side-effecting. The database
 * account must still be read-only; the PostgreSQL adapter additionally runs
 * every statement in a READ ONLY transaction.
 *
 * @param dialect SQL dialect of the target database. Defaults to MySQL.
 */
export function validateSql(
  sql: string,
  policy: SqlSafetyPolicy,
  dialect: SqlDialect = 'mysql',
): SqlValidationResult {
  const rules = rulesFor(dialect);
  const normalized = sql.trim();

  if (!normalized) {
    return { valid: false, reason: 'SQL query is empty.' };
  }

  const { tokens: allTokens, error } = tokenizeSql(normalized, dialect);

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
    !rules.allowedFirstKeywords.has(head.value)
  ) {
    return { valid: false, reason: 'Only read-oriented SQL statements are allowed.' };
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] as SqlToken;
    const following = tokens[index + 1];
    const isCall = isPunct(following, '(');

    // Blocked functions are matched wherever they appear: a name after a dot
    // (pg_catalog.pg_sleep) or in quotes ("pg_sleep") is still that function.
    if (isCall) {
      const name = identifierName(token);

      if (name !== undefined && isBlockedFunction(name, rules)) {
        return {
          valid: false,
          reason: `The function ${name.toLowerCase()}() is not allowed.`,
        };
      }
    }

    if (token.type !== 'word') continue;

    // A word after a dot is part of a qualified name (t.update), not a keyword.
    if (isPunct(tokens[index - 1], '.')) continue;

    if (!policy.readOnly) continue;

    if (rules.blockedKeywords.has(token.value)) {
      if (rules.functionLikeKeywords.has(token.value) && isCall) continue;

      // CHARACTER SET utf8 (in CAST/CONVERT, SHOW CHARACTER SET).
      if (
        dialect !== 'postgres' &&
        token.value === 'SET' &&
        tokens[index - 1]?.value === 'CHARACTER'
      ) {
        continue;
      }

      // Index hints: USE INDEX (...) / USE KEY (...).
      if (
        dialect !== 'postgres' &&
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
      rules.lockingWords.has(following.value)
    ) {
      return {
        valid: false,
        reason: 'Locking reads (FOR SHARE / FOR UPDATE) are not allowed.',
      };
    }
  }

  return { valid: true, sql: output };
}
