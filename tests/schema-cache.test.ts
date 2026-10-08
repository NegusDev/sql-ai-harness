import { describe, expect, it } from 'vitest';
import { SchemaCache } from '../src/schema/cache.js';
import type { DatabaseAdapter } from '../src/core/types/index.js';

function makeDatabase() {
  let listCalls = 0;
  let describeCalls = 0;

  const database: DatabaseAdapter = {
    dialect: 'mysql',
    async listTables() {
      listCalls += 1;
      return [{ name: 'students' }, { name: 'payments' }];
    },
    async describeTable(table) {
      describeCalls += 1;
      return { table: { name: table }, columns: [] };
    },
    async getRelationships() { return []; },
    async executeQuery() { return { rows: [], rowCount: 0, executionTimeMs: 1 }; },
    async explainQuery(sql) { return { sql, plan: [] }; },
  };

  return { database, counts: () => ({ listCalls, describeCalls }) };
}

describe('SchemaCache', () => {
  it('caches table listings and table descriptions within the TTL', async () => {
    const { database, counts } = makeDatabase();
    const cache = new SchemaCache({ ttlMs: 60_000 });

    await cache.listTables(database);
    await cache.listTables(database);
    await cache.describeTable(database, 'students');
    await cache.describeTable(database, 'students');

    expect(counts()).toEqual({ listCalls: 1, describeCalls: 1 });
  });

  it('describes multiple tables concurrently', async () => {
    const { database, counts } = makeDatabase();
    const cache = new SchemaCache();

    const schemas = await cache.describeTables(database, ['students', 'payments']);

    expect(schemas.map((schema) => schema.table.name)).toEqual(['students', 'payments']);
    expect(counts().describeCalls).toBe(2);
  });

  it('can be cleared explicitly', async () => {
    const { database, counts } = makeDatabase();
    const cache = new SchemaCache({ ttlMs: 60_000 });

    await cache.listTables(database);
    cache.clear();
    await cache.listTables(database);

    expect(counts().listCalls).toBe(2);
  });
});
