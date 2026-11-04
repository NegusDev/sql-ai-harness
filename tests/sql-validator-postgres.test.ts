import { describe, expect, it } from 'vitest';
import { validateSql } from '../src/safety/sql-validator.js';
import type { SqlDialect, SqlSafetyPolicy } from '../src/core/types/index.js';

const policy: SqlSafetyPolicy = {
  readOnly: true,
  maxRows: 500,
  queryTimeoutMs: 10_000,
  maxResultBytes: 1_048_576,
};

const pgOk = (sql: string) => {
  const r = validateSql(sql, policy, 'postgres');
  expect(r.valid, `expected valid: ${sql} (${r.reason})`).toBe(true);
};
const pgRejected = (sql: string) => {
  expect(validateSql(sql, policy, 'postgres').valid, `expected rejected: ${sql}`).toBe(false);
};
const valid = (sql: string, dialect: SqlDialect) => validateSql(sql, policy, dialect).valid;

describe('postgres validator: accepts ordinary reads', () => {
  it.each([
    'SELECT * FROM users',
    'SELECT * FROM "Order Items" WHERE "Total" > 10;',
    'SELECT id FROM public.users u JOIN sales.orders o ON o.user_id = u.id',
    'WITH t AS (SELECT 1) SELECT * FROM t',
    "SELECT data #> '{a,b}' FROM docs",
    "SELECT data #>> '{a}' AS a, data -> 'b' FROM docs",
    "SELECT 'it''s; fine'",
    "SELECT E'a\\'b; c'",
    'SELECT $$ DROP TABLE users; $$',
    'SELECT $tag$ ; DELETE FROM x $tag$',
    '/* outer /* nested */ still comment; DROP TABLE x */ SELECT 1',
    'SELECT 1 -- ; DROP TABLE x',
    'SELECT "update", "delete", load, lock, use FROM t',
    'SELECT t.update, t.insert FROM t',
    "SELECT replace(name, 'a', 'b'), left(name, 2) FROM t",
    'SELECT * FROM t WHERE id = $1',
    'SELECT * FROM t FOR_X',
    "SHOW search_path",
    'EXPLAIN SELECT * FROM t',
    'SELECT current_setting(\'statement_timeout\')',
    'SELECT * FROM t LIMIT 5 OFFSET 10',
  ])('%s', (sql) => pgOk(sql));
});

describe('postgres validator: rejects unsafe statements', () => {
  it.each([
    'DELETE FROM t',
    'INSERT INTO t VALUES (1)',
    'UPDATE t SET a = 1',
    'DROP TABLE t',
    'COPY t TO PROGRAM \'id\'',
    "DO $$ BEGIN PERFORM 1; END $$",
    'VACUUM t',
    'SELECT 1; SELECT 2',
    'SELECT 1; DROP TABLE t',
    'SELECT * INTO new_table FROM t',
    'WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d',
    'EXPLAIN ANALYZE DELETE FROM t',
    'SELECT * FROM t FOR UPDATE',
    'SELECT * FROM t FOR NO KEY UPDATE',
    'SELECT * FROM t FOR SHARE',
    'SELECT * FROM t FOR KEY SHARE',
    'SELECT set_config(\'statement_timeout\', \'0\', false)',
    'SELECT pg_sleep(10)',
    'SELECT pg_catalog.pg_sleep(10)',
    'SELECT "pg_sleep"(10)',
    'SELECT pg_catalog."pg_sleep"(10)',
    'SELECT pg_read_file(\'/etc/passwd\')',
    'SELECT pg_ls_dir(\'.\')',
    'SELECT pg_advisory_lock(1)',
    'SELECT lo_import(\'/etc/passwd\')',
    'SELECT nextval(\'s\')',
    "SELECT query_to_xml('DELETE FROM t', true, true, '')",
    "SELECT * FROM dblink('host=x', 'select 1') AS t(a int)",
    "SELECT U&'\\0041'",
    'SELECT U&"d\\0061ta" FROM t',
    'SELECT 1 /* unterminated',
    "SELECT 'unterminated",
    'SELECT $$ unterminated',
    '',
  ])('%s', (sql) => pgRejected(sql));
});

describe('postgres validator: lexical rules differ from MySQL', () => {
  it('backslash does not escape a quote in a plain string', () => {
    // Postgres: the string is `\` and a second statement follows.
    const sql = "SELECT '\\'; DELETE FROM t; --'";
    expect(valid(sql, 'postgres')).toBe(false);
    // MySQL: the whole thing is one string literal.
    expect(valid(sql, 'mysql')).toBe(true);
  });

  it('# is an operator, not a comment', () => {
    // Postgres: `#>` then a real semicolon and a second statement.
    expect(valid("SELECT a #> b; DELETE FROM t", 'postgres')).toBe(false);
    // MySQL really does treat everything after # as a comment.
    expect(valid("SELECT a #> b; DELETE FROM t", 'mysql')).toBe(true);
    // Postgres must not treat the rest of the line after # as a comment.
    expect(valid("SELECT a #> 'x' FROM t WHERE 1=1; DELETE FROM t", 'postgres')).toBe(false);
  });

  it('block comments nest', () => {
    // After the nested comment closes, the outer one is still open, so the
    // DELETE is inside the comment in Postgres but live SQL in MySQL.
    const sql = 'SELECT 1 /* a /* b */ ; DELETE FROM t; */';
    expect(valid(sql, 'postgres')).toBe(true);
    expect(valid(sql, 'mysql')).toBe(false);
  });

  it('E-strings do honour backslash escapes', () => {
    pgOk("SELECT E'\\'; DELETE FROM t; --'");
    pgRejected("SELECT E'x'; DELETE FROM t");
  });

  it('double quotes are identifiers, not strings', () => {
    pgOk('SELECT "delete" FROM t');
    expect(valid('SELECT "a;b" FROM t', 'postgres')).toBe(true);
  });

  it('only a trailing semicolon is accepted and it is stripped', () => {
    const r = validateSql('SELECT 1;  ', policy, 'postgres');
    expect(r).toEqual({ valid: true, sql: 'SELECT 1' });
  });

  it('MySQL behaviour is unchanged by the default dialect', () => {
    expect(validateSql('SELECT 1 # ; DROP TABLE t', policy).valid).toBe(true);
    expect(validateSql('SELECT SLEEP(5)', policy).valid).toBe(false);
  });
});
