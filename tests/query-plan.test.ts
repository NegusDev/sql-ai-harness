import { describe, expect, it } from 'vitest';
import {
  checkSqlFollowsPlan,
  extractTableReferences,
  type StructuredQueryPlan,
} from '../src/core/agent/query-plan.js';

const tables = (sql: string, dialect: 'mysql' | 'postgres' = 'mysql') =>
  extractTableReferences(sql, dialect).tables.sort();

describe('extractTableReferences', () => {
  it.each([
    ['SELECT * FROM clients', ['clients']],
    ['SELECT * FROM Clients c WHERE c.id = 1', ['clients']],
    ['SELECT * FROM clients c JOIN transactions t ON t.client_id = c.id', ['clients', 'transactions']],
    ['SELECT * FROM clients c LEFT OUTER JOIN transactions t ON t.client_id = c.id', ['clients', 'transactions']],
    ['SELECT * FROM clients, transactions WHERE 1 = 1', ['clients', 'transactions']],
    ['SELECT * FROM a, b, c', ['a', 'b', 'c']],
    ['SELECT * FROM `my db`.`order items`', ['order items']],
    ['SELECT * FROM (SELECT id FROM clients) x JOIN transactions t ON t.id = x.id', ['clients', 'transactions']],
    ['SELECT * FROM clients WHERE id IN (SELECT client_id FROM transactions)', ['clients', 'transactions']],
    ['SELECT id FROM clients UNION SELECT client_id FROM transactions', ['clients', 'transactions']],
    ['SELECT EXTRACT(YEAR FROM created_at) FROM clients', ['clients']],
    ["SELECT SUBSTRING(name FROM 2) FROM clients", ['clients']],
    ["SELECT TRIM(BOTH ' ' FROM name) FROM clients", ['clients']],
    ['SELECT 1', []],
    // A comma inside a function call is not a table separator.
    ['SELECT * FROM clients WHERE id IN (1, 2, 3) AND COALESCE(a, b) > 0', ['clients']],
    // Strings that merely contain keywords are ignored.
    ["SELECT 'from secrets' AS x FROM clients", ['clients']],
  ])('%s', (sql, expected) => {
    expect(tables(sql)).toEqual(expected);
  });

  it('treats CTE names as non-tables but still reads their bodies', () => {
    const result = extractTableReferences(
      'WITH recent AS (SELECT * FROM transactions), big AS (SELECT * FROM recent) SELECT * FROM big JOIN clients ON 1 = 1',
      'mysql',
    );
    expect(result.tables.sort()).toEqual(['clients', 'transactions']);
    expect(result.ctes.sort()).toEqual(['big', 'recent']);
  });

  it('handles postgres schema qualification and quoted identifiers', () => {
    expect(tables('SELECT * FROM public."Order Items" o JOIN public.clients c ON true', 'postgres')).toEqual([
      'clients',
      'order items',
    ]);
  });

  it('does not treat IS DISTINCT FROM as a table reference', () => {
    expect(tables('SELECT * FROM clients WHERE a IS DISTINCT FROM b', 'postgres')).toEqual(['clients']);
  });

  it('returns nothing for SQL that cannot be tokenized', () => {
    expect(tables("SELECT 'unterminated FROM clients")).toEqual([]);
  });
});

describe('checkSqlFollowsPlan', () => {
  const plan = (tables: string[]): StructuredQueryPlan => ({
    objective: 'x',
    tables,
    fields: [],
    filters: [],
    joins: [],
  });

  it('passes when the SQL tables are a subset of the plan', () => {
    expect(checkSqlFollowsPlan('SELECT * FROM clients', plan(['clients', 'transactions']), 'mysql')).toEqual({
      ok: true,
      unplanned: [],
    });
  });

  it('lists tables the plan does not cover', () => {
    expect(checkSqlFollowsPlan('SELECT * FROM clients JOIN secrets ON 1 = 1', plan(['clients']), 'mysql')).toEqual({
      ok: false,
      unplanned: ['secrets'],
    });
  });

  it('matches schema-qualified plan tables by bare name, case-insensitively', () => {
    expect(checkSqlFollowsPlan('SELECT * FROM Orders', plan(['public.orders']), 'postgres').ok).toBe(true);
  });
});
