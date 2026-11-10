import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/config.js';

const base = { AI_PROVIDER: 'groq', AI_MODEL: 'm', GROQ_API_KEY: 'k' };

describe('database config', () => {
  it('defaults to MySQL on 3306 without TLS', () => {
    const { database } = loadConfig(base);
    expect(database).toMatchObject({ driver: 'mysql', port: 3306, ssl: 'disable' });
  });

  it('defaults to 5432 for postgres', () => {
    expect(loadConfig({ ...base, DB_DRIVER: 'postgres' }).database.port).toBe(5432);
  });

  it('treats an empty DB_PORT as unset and honours an explicit one', () => {
    expect(loadConfig({ ...base, DB_DRIVER: 'postgres', DB_PORT: '' }).database.port).toBe(5432);
    expect(loadConfig({ ...base, DB_DRIVER: 'postgres', DB_PORT: '6543' }).database.port).toBe(6543);
  });

  it('accepts TLS modes and rejects unknown ones', () => {
    expect(loadConfig({ ...base, DB_SSL: 'verify-full' }).database.ssl).toBe('verify-full');
    expect(() => loadConfig({ ...base, DB_SSL: 'yes' })).toThrow();
  });

  it('requires DEEPSEEK_API_KEY for deepseek', () => {
       expect(() => loadConfig({ AI_PROVIDER: 'deepseek', AI_MODEL: 'm' })).toThrow(/DEEPSEEK_API_KEY/);
  });
});
