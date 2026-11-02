import { describe, expect, it } from 'vitest';
import { validateSql } from '../src/safety/sql-validator.js';
import { tokenizeSql } from '../src/safety/sql-tokenizer.js';
import type { SqlSafetyPolicy } from '../src/core/types/index.js';

const policy: SqlSafetyPolicy = {
  readOnly: true,
  maxRows: 500,
  queryTimeoutMs: 10_000,
  maxResultBytes: 1_048_576,
};

function ok(sql: string): void {
  const result = validateSql(sql, policy);
  expect(result.valid, `expected valid: ${sql} (${result.reason})`).toBe(true);
}

function rejected(sql: string): void {
  const result = validateSql(sql, policy);
  expect(result.valid, `expected rejected: ${sql}`).toBe(false);
  expect(result.reason).toBeTruthy();
}

describe('validateSql: basics', () => {
  it('allows a SELECT query', () => {
    expect(validateSql('SELECT * FROM users;', policy).valid).toBe(true);
  });

  it('rejects write operations', () => {
    expect(validateSql('DELETE FROM users', policy).valid).toBe(false);
    expect(validateSql('UPDATE users SET name = "x"', policy).valid).toBe(false);
  });

  it('rejects multiple statements', () => {
    expect(validateSql('SELECT 1; SELECT 2', policy).valid).toBe(false);
  });

  it('allows a leading comment before a read query', () => {
    expect(validateSql('-- explain this\nSELECT * FROM users', policy).valid).toBe(true);
  });

  it('rejects empty and comment-only input', () => {
    rejected('');
    rejected('   ');
    rejected('-- nothing here');
    rejected('/* nothing */');
    rejected(';');
  });

  it('strips a single trailing semicolon and anything after it', () => {
    expect(validateSql('SELECT 1;', policy).sql).toBe('SELECT 1');
    expect(validateSql('SELECT 1 ; -- done', policy).sql).toBe('SELECT 1');
    expect(validateSql('SELECT 1; /* done */', policy).sql).toBe('SELECT 1');
  });

  it('returns the original SQL otherwise unchanged', () => {
    const sql = "SELECT name FROM users WHERE note = 'a;b' -- keep";
    expect(validateSql(sql, policy).sql).toBe(sql);
  });
});

describe('validateSql: statements that must be accepted', () => {
  it.each([
    'SELECT 1',
    'select * from users',
    'WITH recent AS (SELECT * FROM orders) SELECT * FROM recent',
    '(SELECT id FROM a) UNION (SELECT id FROM b)',
    'EXPLAIN SELECT * FROM users',
    'SHOW TABLES',
    'DESCRIBE users',
    'DESC users',
    'SELECT * FROM users ORDER BY created_at DESC',
  ])('allows %s', (sql) => ok(sql));

  describe('functions that share a name with a blocked keyword', () => {
    it.each([
      "SELECT REPLACE(name, 'a', 'b') FROM users",
      "SELECT replace (name, 'a', 'b') FROM users",
      "SELECT INSERT('Quadratic', 3, 4, 'What')",
      'SELECT TRUNCATE(price, 2) FROM products',
    ])('allows %s', (sql) => ok(sql));
  });

  describe('keywords that are only data', () => {
    it.each([
      "SELECT * FROM logs WHERE action = 'delete'",
      "SELECT * FROM logs WHERE note LIKE '%drop table users%'",
      "SELECT 'a; DELETE FROM users'",
      "SELECT '-- not a comment'",
      "SELECT '/* nor this */'",
      "SELECT 'it''s fine; DROP TABLE x'",
      "SELECT 'it\\'s fine; DROP TABLE x'",
      'SELECT "double; DROP TABLE x"',
      'SELECT `update`, `delete` FROM `set`',
      'SELECT t.delete, t.update FROM tbl t',
      'SELECT created_at, updated_at, deleted_at FROM users',
      'SELECT * FROM users /* DROP TABLE x */',
      'SELECT * FROM users -- DELETE FROM x',
      'SELECT * FROM users # DELETE FROM x',
      'SELECT /*+ MAX_EXECUTION_TIME(1000) */ * FROM users',
    ])('allows %s', (sql) => ok(sql));
  });

  describe('legitimate uses of otherwise-blocked words', () => {
    it.each([
      'SELECT CAST(name AS CHAR CHARACTER SET utf8mb4) FROM users',
      'SHOW CHARACTER SET',
      'SELECT * FROM users USE INDEX (idx_name)',
      'SELECT FIND_IN_SET(1, tags) FROM posts',
    ])('allows %s', (sql) => ok(sql));
  });

  it('treats --x (no whitespace) as arithmetic, not a comment', () => {
    ok('SELECT 1--1');
  });
});

describe('validateSql: write and DDL statements', () => {
  it.each([
    'INSERT INTO users (name) VALUES ("x")',
    'UPDATE users SET name = "x"',
    'DELETE FROM users',
    'DROP TABLE users',
    'TRUNCATE TABLE users',
    'ALTER TABLE users ADD COLUMN x INT',
    'CREATE TABLE t (id INT)',
    'REPLACE INTO users (id) VALUES (1)',
    'GRANT ALL ON *.* TO x',
    'CALL do_something()',
    'SET @a = 1',
    'USE other_db',
    'LOAD DATA INFILE "/tmp/x" INTO TABLE t',
    "PREPARE s FROM 'DELETE FROM users'",
    'EXECUTE s',
    'RENAME TABLE a TO b',
    'KILL 1',
    'FLUSH TABLES',
    'LOCK TABLES users WRITE',
  ])('rejects %s', (sql) => rejected(sql));

  it.each([
    'dElEtE FROM users',
    'delete from users',
    'DELETE\nFROM users',
    'DELETE\tFROM users',
  ])('rejects case and whitespace variant %j', (sql) => rejected(sql));

  it('rejects a write hidden after a leading comment', () => {
    rejected('/* hi */ DELETE FROM users');
    rejected('-- hi\nDELETE FROM users');
    rejected('# hi\nDELETE FROM users');
  });
});

describe('validateSql: statement stacking and comment tricks', () => {
  it.each([
    'SELECT 1; DROP TABLE users',
    'SELECT 1;DROP TABLE users',
    'SELECT 1;\nDELETE FROM users',
    'SELECT 1; /* x */ DELETE FROM users',
    'SELECT 1 # note\n; DELETE FROM users',
    'SELECT 1 -- ;\n; DELETE FROM users',
    "SELECT 'a'; DELETE FROM users",
    'SELECT 1;;',
    'SELECT 1; SELECT 2;',
  ])('rejects %j', (sql) => rejected(sql));

  it('rejects MySQL executable comments, which the server runs', () => {
    rejected('SELECT 1 /*! ; DROP TABLE users */');
    rejected('SELECT /*!50000 SLEEP(5) */ 1');
    rejected('SELECT 1 /*M! ; DROP TABLE users */');
  });

  it('does not treat --x as a comment, so hidden keywords are still seen', () => {
    rejected('SELECT 1 --DELETE FROM users');
  });

  it('rejects unterminated strings, identifiers, and comments', () => {
    rejected("SELECT 'abc");
    rejected('SELECT "abc');
    rejected('SELECT `abc');
    rejected('SELECT 1 /* never closed');
    rejected("SELECT 'abc\\'");
  });

  it('rejects a write after a CTE or EXPLAIN', () => {
    rejected('WITH x AS (SELECT 1) DELETE FROM users');
    rejected('WITH x AS (SELECT 1) REPLACE INTO users SELECT * FROM x');
    rejected('EXPLAIN DELETE FROM users');
    rejected('EXPLAIN ANALYZE DELETE FROM users');
  });
});

describe('validateSql: file access, locking, and connection abuse', () => {
  it.each([
    "SELECT * FROM users INTO OUTFILE '/tmp/users.csv'",
    "SELECT * FROM users INTO DUMPFILE '/tmp/users.bin'",
    'SELECT id INTO @v FROM users',
    "SELECT LOAD_FILE('/etc/passwd')",
    'SELECT SLEEP(10)',
    'SELECT sleep(10)',
    'SELECT SLEEP /* hide */ (10)',
    'SELECT BENCHMARK(100000000, MD5(1))',
    "SELECT GET_LOCK('x', 10)",
    "SELECT RELEASE_LOCK('x')",
    'SELECT * FROM users FOR UPDATE',
    'SELECT * FROM users FOR SHARE',
    'SELECT * FROM users LOCK IN SHARE MODE',
  ])('rejects %s', (sql) => rejected(sql));

  it('does not reject SLEEP when it is not called as a function', () => {
    ok('SELECT sleep FROM settings');
    ok('SELECT `sleep` FROM settings');
  });

  it('still blocks dangerous functions when readOnly is off', () => {
    const relaxed = { ...policy, readOnly: false };
    expect(validateSql('SELECT SLEEP(10)', relaxed).valid).toBe(false);
    expect(validateSql("SELECT LOAD_FILE('/etc/passwd')", relaxed).valid).toBe(false);
  });

  it('still requires a read-oriented first keyword when readOnly is off', () => {
    const relaxed = { ...policy, readOnly: false };
    expect(validateSql('DELETE FROM users', relaxed).valid).toBe(false);
    expect(validateSql('SELECT 1', relaxed).valid).toBe(true);
  });
});

describe('tokenizeSql', () => {
  it('keeps string contents out of the token stream', () => {
    const { tokens, error } = tokenizeSql("SELECT 'DELETE' FROM t");
    expect(error).toBeUndefined();
    expect(tokens.map((t) => t.value)).toEqual(['SELECT', "'DELETE'", 'FROM', 'T']);
  });

  it('skips all three comment styles', () => {
    const { tokens } = tokenizeSql('SELECT /* a */ 1 -- b\n, 2 # c');
    expect(tokens.map((t) => t.value)).toEqual(['SELECT', '1', ',', '2']);
  });

  it('handles doubled quotes and backslash escapes', () => {
    expect(tokenizeSql("'it''s'").tokens).toHaveLength(1);
    expect(tokenizeSql("'it\\'s'").tokens).toHaveLength(1);
    expect(tokenizeSql('`a``b`').tokens).toHaveLength(1);
  });

  it('reports positions that match the source', () => {
    const sql = 'SELECT 1;';
    const semicolon = tokenizeSql(sql).tokens.at(-1);
    expect(semicolon?.start).toBe(sql.indexOf(';'));
  });
});
