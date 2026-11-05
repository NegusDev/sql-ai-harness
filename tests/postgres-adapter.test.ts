import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgresAdapter } from '../src/database/postgres/adapter.js';

/**
 * Integration tests. They run only when a PostgreSQL server is configured:
 *   TEST_PG_HOST, TEST_PG_PORT, TEST_PG_DATABASE, TEST_PG_USER, TEST_PG_PASSWORD
 * The user must be able to create schemas (it is deliberately NOT read-only,
 * so the tests prove the adapter itself blocks writes).
 */
const host = process.env.TEST_PG_HOST;
const describeDb = host ? describe : describe.skip;

const config = {
  host: host ?? '',
  port: Number(process.env.TEST_PG_PORT ?? 5432),
  database: process.env.TEST_PG_DATABASE ?? '',
  user: process.env.TEST_PG_USER ?? '',
  password: process.env.TEST_PG_PASSWORD ?? '',
};

describeDb('PostgresAdapter (integration)', () => {
  let adapter: PostgresAdapter;
  let admin: pg.Client;

  beforeAll(async () => {
    admin = new pg.Client(config);
    await admin.connect();
    await admin.query(`
      DROP SCHEMA IF EXISTS harness_it CASCADE;
      DROP TABLE IF EXISTS public.hit_customers, public."Hit Orders" CASCADE;
      CREATE SCHEMA harness_it;
      CREATE TABLE public.hit_customers (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL,
        born date,
        seen timestamp,
        seen_tz timestamptz,
        amount numeric(10,2),
        big bigint,
        tags text[],
        doc jsonb,
        blob bytea
      );
      CREATE TABLE public."Hit Orders" (
        a integer, b integer, customer_id integer REFERENCES public.hit_customers(id),
        PRIMARY KEY (a, b)
      );
      CREATE TABLE harness_it.detail (
        order_a integer, order_b integer, note text,
        CONSTRAINT detail_order_fk FOREIGN KEY (order_a, order_b) REFERENCES public."Hit Orders"(a, b)
      );
      INSERT INTO public.hit_customers (name, born, seen, seen_tz, amount, big, tags, doc, blob)
      VALUES ('Ann', '2026-05-11', '2026-05-11 09:51:43', '2026-05-11 09:51:43+00', 12.50,
              9007199254740993, ARRAY['a','b'], '{"k": [1,2]}', '\\xdeadbeef');
      INSERT INTO public.hit_customers (name) SELECT 'c' || g FROM generate_series(1, 50) g;
    `);
    adapter = new PostgresAdapter({ ...config, connectionLimit: 2 });
  });

  afterAll(async () => {
    await admin?.query(
      'DROP SCHEMA IF EXISTS harness_it CASCADE; DROP TABLE IF EXISTS public.hit_customers, public."Hit Orders" CASCADE;',
    );
    await admin?.end();
    await adapter?.close();
  });

  it('reports its dialect', () => {
    expect(adapter.dialect).toBe('postgres');
  });

  it('lists tables, qualifying only those outside the search path', async () => {
    const names = (await adapter.listTables()).map((t) => t.name);
    expect(names).toContain('hit_customers');
    expect(names).toContain('Hit Orders');
    expect(names).toContain('harness_it.detail');
    expect(names.some((n) => n.startsWith('pg_') || n.startsWith('information_schema'))).toBe(false);
  });

  it('describes a table with keys, defaults and identity columns', async () => {
    const t = await adapter.describeTable('hit_customers');
    const id = t.columns.find((c) => c.name === 'id')!;
    expect(id.isPrimaryKey).toBe(true);
    expect(id.isAutoIncrement).toBe(true);
    expect(t.columns.find((c) => c.name === 'name')!.nullable).toBe(false);
    expect(t.columns.find((c) => c.name === 'amount')!.dataType).toBe('numeric(10,2)');
  });

  it('resolves quoted, mixed-case and schema-qualified names', async () => {
    expect((await adapter.describeTable('"Hit Orders"')).columns).toHaveLength(3);
    expect((await adapter.describeTable('Hit Orders')).table.name).toBe('Hit Orders');
    expect((await adapter.describeTable('harness_it.detail')).columns).toHaveLength(3);
    expect((await adapter.describeTable('HIT_CUSTOMERS')).table.name).toBe('hit_customers');
    await expect(adapter.describeTable('nope')).rejects.toThrow(/not found/);
    await expect(adapter.describeTable("x'; DROP TABLE y; --")).rejects.toThrow(/not found/);
  });

  it('returns one row per column of composite foreign keys', async () => {
    const all = await adapter.getRelationships();
    const detail = all.filter((r) => r.constraintName === 'detail_order_fk');
    expect(detail.map((r) => [r.column, r.referencedColumn]).sort()).toEqual([
      ['order_a', 'a'],
      ['order_b', 'b'],
    ]);
    expect(detail[0]).toMatchObject({ table: 'harness_it.detail', referencedTable: 'Hit Orders' });

    const scoped = await adapter.getRelationships('"Hit Orders"');
    expect(scoped).toHaveLength(1);
    expect(scoped[0]).toMatchObject({ column: 'customer_id', referencedTable: 'hit_customers' });
  });

  it('serialises types predictably', async () => {
    const { rows } = await adapter.executeQuery('SELECT * FROM hit_customers WHERE name = \'Ann\'');
    const r = rows[0]!;
    expect(r.born).toBe('2026-05-11');
    expect(r.seen).toBe('2026-05-11 09:51:43');
    expect(String(r.seen_tz)).toMatch(/^2026-05-11 \d\d:51:43/);
    expect(r.amount).toBe('12.50');
    expect(r.big).toBe('9007199254740993');
    expect(r.tags).toEqual(['a', 'b']);
    expect(r.doc).toEqual({ k: [1, 2] });
    expect(r.blob).toBe('\\xdeadbeef');
    expect(() => JSON.stringify(rows)).not.toThrow();
  });

  it('caps rows and reports truncation', async () => {
    const full = await adapter.executeQuery('SELECT * FROM hit_customers', { maxRows: 100 });
    expect(full.rowCount).toBe(51);
    expect(full.truncated).toBe(false);

    const cut = await adapter.executeQuery('SELECT * FROM hit_customers', { maxRows: 10 });
    expect(cut.rowCount).toBe(10);
    expect(cut.truncated).toBe(true);
  });

  it('caps result size in bytes', async () => {
    const r = await adapter.executeQuery("SELECT repeat('x', 1000) AS v FROM generate_series(1, 50)", {
      maxRows: 100,
      maxResultBytes: 5_000,
    });
    expect(r.truncated).toBe(true);
    expect(r.rowCount).toBeLessThan(50);
  });

  it('refuses writes even though the connected role may write', async () => {
    await expect(adapter.executeQuery("INSERT INTO hit_customers (name) VALUES ('x')")).rejects.toThrow(/read-only/i);
    await expect(adapter.executeQuery('CREATE TABLE harness_it.t (a int)')).rejects.toThrow(/read-only/i);
    await expect(adapter.executeQuery('SELECT nextval(pg_get_serial_sequence(\'hit_customers\', \'id\'))')).rejects.toThrow();

    const { rows } = await adapter.executeQuery('SELECT count(*)::int AS n FROM hit_customers', {});
    expect(rows[0]!.n).toBe(51);
  });

  it('cannot leave read-only mode from SQL', async () => {
    await expect(adapter.executeQuery('SET TRANSACTION READ WRITE')).rejects.toThrow();
  });

  it('rejects multiple statements at the server', async () => {
    await expect(adapter.executeQuery('SELECT 1; SELECT 2')).rejects.toThrow();
  });

  it('cancels slow queries and stays usable', async () => {
    const started = Date.now();
    await expect(adapter.executeQuery('SELECT pg_sleep(5)', { timeoutMs: 300 })).rejects.toThrow(/timeout/i);
    expect(Date.now() - started).toBeLessThan(3_000);

    // Pool of 2: repeated failures must not leak connections.
    for (let i = 0; i < 4; i += 1) {
      await expect(adapter.executeQuery('SELECT pg_sleep(5)', { timeoutMs: 100 })).rejects.toThrow();
    }
    expect((await adapter.executeQuery('SELECT 1 AS ok')).rows).toEqual([{ ok: 1 }]);
  });

  it('survives syntax errors', async () => {
    await expect(adapter.executeQuery('SELEC nope')).rejects.toThrow(/syntax/i);
    expect((await adapter.executeQuery('SELECT 2 AS ok')).rows).toEqual([{ ok: 2 }]);
  });

  it('explains without executing', async () => {
    const before = (await adapter.executeQuery('SELECT count(*)::int AS n FROM hit_customers')).rows[0]!.n;
    const plan = await adapter.explainQuery('SELECT * FROM hit_customers WHERE id = 1');
    expect(JSON.stringify(plan.plan)).toContain('Plan');
    // Plain EXPLAIN only plans; it never runs the statement (the validator rejects it earlier anyway).
    await adapter.explainQuery('DELETE FROM hit_customers');
    const after = (await adapter.executeQuery('SELECT count(*)::int AS n FROM hit_customers')).rows[0]!.n;
    expect(after).toBe(before);
  });

  it('applies timeouts per query without leaking settings between connections', async () => {
    const { rows } = await adapter.executeQuery("SELECT current_setting('statement_timeout') AS t", { timeoutMs: 1234 });
    expect(rows[0]!.t).toBe('1234ms');
    const again = await adapter.executeQuery("SELECT current_setting('statement_timeout') AS t", { timeoutMs: 4321 });
    expect(again.rows[0]!.t).toBe('4321ms');
  });
});
