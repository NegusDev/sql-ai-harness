import { describe, expect, it } from 'vitest';
import { validateSql } from '../src/safety/sql-validator.js';
import type { SqlSafetyPolicy } from '../src/core/types/index.js';

const policy: SqlSafetyPolicy = {
  readOnly: true,
  maxRows: 500,
  queryTimeoutMs: 10_000,
  maxResultBytes: 1_048_576,
};

describe('validateSql', () => {
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
});
