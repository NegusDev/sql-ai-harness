import { z } from 'zod';
import { tokenizeSql, type SqlToken } from '../../safety/sql-tokenizer.js';
import type {
  RelationshipInfo,
  SqlDialect,
  TableInfo,
  TableSchema,
} from '../types/index.js';

const columnRef = z.object({
  table: z.string().trim().min(1),
  column: z.string().trim().min(1),
});

/**
 * The plan the model must submit before it may run SQL. Tables and columns are
 * structured so they can be checked against the real schema instead of being
 * free text nobody reads.
 */
export const queryPlanSchema = z.object({
  objective: z.string().trim().min(1).max(500),
  tables: z.array(z.string().trim().min(1)).min(1).max(20),
  fields: z
    .array(columnRef)
    .max(40)
    .describe('Columns the query reads or returns, each as {table, column}.'),
  filters: z.array(z.string().trim().min(1)).max(30),
  joins: z
    .array(
      z.object({
        left: columnRef,
        right: columnRef,
      }),
    )
    .max(20)
    .describe('One entry per join condition: {left:{table,column}, right:{table,column}}.'),
  aggregations: z.array(z.string().trim().min(1)).max(20).optional(),
  sorting: z.array(z.string().trim().min(1)).max(20).optional(),
});

/** Named to avoid clashing with the EXPLAIN `QueryPlan` in core/types. */
export type StructuredQueryPlan = z.infer<typeof queryPlanSchema>;

export interface SchemaFacts {
  dialect: SqlDialect;
  tables: TableInfo[];
  relationships: RelationshipInfo[];
  describe(table: TableInfo): Promise<TableSchema>;
}

export interface PlanValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const lower = (value: string): string => value.toLowerCase();

function qualified(table: TableInfo): string {
  return table.schema ? `${table.schema}.${table.name}` : table.name;
}

function findTable(tables: TableInfo[], name: string): TableInfo | undefined {
  const wanted = lower(name);
  const exact = tables.filter(
    (table) => lower(qualified(table)) === wanted || lower(table.name) === wanted,
  );
  return exact[0];
}

/**
 * Checks a plan against the live schema: every table exists, every column
 * exists, fields and joins only touch planned tables, and the planned tables
 * form one connected join graph (no accidental cross joins). Joins that are not
 * a declared foreign key are allowed but reported as warnings.
 */
export async function validatePlan(
  plan: StructuredQueryPlan,
  facts: SchemaFacts,
): Promise<PlanValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const resolved = new Map<string, TableInfo>();
  const unknown: string[] = [];

  for (const name of plan.tables) {
    const table = findTable(facts.tables, name);
    if (table) resolved.set(lower(name), table);
    else unknown.push(name);
  }

  if (unknown.length > 0) {
    errors.push(
      `Unknown table${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}. Available tables: ${facts.tables.slice(0, 40).map(qualified).join(', ')}${facts.tables.length > 40 ? ', ...' : ''}.`,
    );
  }

  const columns = new Map<string, Set<string>>();

  for (const [key, table] of resolved) {
    try {
      const schema = await facts.describe(table);
      columns.set(key, new Set(schema.columns.map((column) => lower(column.name))));
    } catch (error) {
      errors.push(
        `Could not describe table ${qualified(table)}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const checkRef = (ref: { table: string; column: string }, where: string): void => {
    const key = lower(ref.table);

    if (!resolved.has(key)) {
      if (!unknown.some((name) => lower(name) === key)) {
        errors.push(`${where} refers to ${ref.table}.${ref.column}, but ${ref.table} is not listed in "tables".`);
      }
      return;
    }

    const known = columns.get(key);
    if (known && !known.has(lower(ref.column))) {
      errors.push(`${where} refers to ${ref.table}.${ref.column}, but ${ref.table} has no column "${ref.column}".`);
    }
  };

  plan.fields.forEach((field) => checkRef(field, 'Field'));
  plan.joins.forEach((join) => {
    checkRef(join.left, 'Join');
    checkRef(join.right, 'Join');
  });

  // Connectivity: every planned table must be reachable through the joins.
  const parent = new Map<string, string>();
  const find = (key: string): string => {
    let root = key;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    return root;
  };

  for (const key of resolved.keys()) parent.set(key, key);

  for (const join of plan.joins) {
    const a = lower(join.left.table);
    const b = lower(join.right.table);
    if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b));
  }

  if (resolved.size > 1) {
    const roots = new Set([...resolved.keys()].map(find));
    if (roots.size > 1) {
      const groups = new Map<string, string[]>();
      for (const key of resolved.keys()) {
        const root = find(key);
        groups.set(root, [...(groups.get(root) ?? []), key]);
      }
      errors.push(
        `The planned tables are not connected by joins (${[...groups.values()].map((g) => g.join('+')).join(' | ')}). Add the join conditions that connect them, or remove tables the query does not need.`,
      );
    }
  }

  // Joins that are not a declared foreign key: allowed, but flagged.
  for (const join of plan.joins) {
    const left = resolved.get(lower(join.left.table));
    const right = resolved.get(lower(join.right.table));
    if (!left || !right) continue;

    const matches = (a: TableInfo, ac: string, b: TableInfo, bc: string): boolean =>
      facts.relationships.some(
        (rel) =>
          lower(rel.table) === lower(a.name) &&
          lower(rel.column) === lower(ac) &&
          lower(rel.referencedTable) === lower(b.name) &&
          lower(rel.referencedColumn) === lower(bc),
      );

    const declared =
      matches(left, join.left.column, right, join.right.column) ||
      matches(right, join.right.column, left, join.left.column);

    if (!declared && facts.relationships.length > 0) {
      warnings.push(
        `${join.left.table}.${join.left.column} = ${join.right.table}.${join.right.column} is not a declared foreign key.`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export interface TableReferences {
  /** Lower-cased bare table names referenced in FROM / JOIN positions. */
  tables: string[];
  /** Names defined by WITH clauses; these are not real tables. */
  ctes: string[];
}

const FROM_END = new Set([
  'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'INTERSECT', 'EXCEPT',
  'ON', 'USING', 'WINDOW', 'OFFSET', 'FETCH', 'FOR', 'JOIN', 'INNER', 'LEFT',
  'RIGHT', 'FULL', 'CROSS', 'NATURAL',
]);

const FROM_FUNCTIONS = new Set(['EXTRACT', 'SUBSTRING', 'TRIM', 'OVERLAY', 'POSITION']);

function isName(token: SqlToken | undefined): token is SqlToken {
  return !!token && (token.type === 'word' || token.type === 'quoted-identifier');
}

function bare(token: SqlToken): string {
  const value = token.value;
  if (token.type === 'quoted-identifier') {
    return lower(value.slice(1, -1).replace(/""|``/g, (m) => m[0]));
  }
  return lower(value);
}

/**
 * Extracts the tables a SELECT reads. Handles quoting, schema qualification,
 * comma lists, joins, subqueries and CTE names. Returns an empty result when
 * the SQL cannot be tokenized; the SQL validator reports that failure itself.
 */
export function extractTableReferences(sql: string, dialect: SqlDialect): TableReferences {
  const { tokens, error } = tokenizeSql(sql, dialect);
  const empty: TableReferences = { tables: [], ctes: [] };
  if (error) return empty;

  const tables = new Set<string>();
  const ctes = new Set<string>();

  // Per paren depth: is a FROM list currently open, and is this a function paren.
  const fromOpen: boolean[] = [false];
  const functionParen: boolean[] = [false];
  let depth = 0;

  const readTableName = (index: number): number => {
    // Returns the index after the (possibly qualified) name, recording it.
    const first = tokens[index];
    if (!isName(first)) return index;

    let last = first;
    let next = index + 1;

    while (tokens[next]?.value === '.' && isName(tokens[next + 1])) {
      last = tokens[next + 1];
      next += 2;
    }

    tables.add(bare(last));
    return next;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'punct') {
      if (token.value === '(') {
        const before = tokens[i - 1];
        depth++;
        fromOpen[depth] = false;
        functionParen[depth] = before?.type === 'word' && FROM_FUNCTIONS.has(before.value);
      } else if (token.value === ')') {
        fromOpen[depth] = false;
        depth = Math.max(0, depth - 1);
      } else if (token.value === ',' && fromOpen[depth] && !functionParen[depth]) {
        i = readTableName(i + 1) - 1;
      }
      continue;
    }

    if (token.type !== 'word') continue;

    if (token.value === 'WITH') {
      // WITH [RECURSIVE] name [(cols)] AS ( ... ) [, name AS ( ... )]
      let j = i + 1;
      if (tokens[j]?.value === 'RECURSIVE') j++;

      while (isName(tokens[j])) {
        ctes.add(bare(tokens[j]));
        j++;
        if (tokens[j]?.value === '(') {
          // optional column list, skip to matching paren
          let level = 0;
          for (; j < tokens.length; j++) {
            if (tokens[j].value === '(') level++;
            if (tokens[j].value === ')' && --level === 0) {
              j++;
              break;
            }
          }
        }
        if (tokens[j]?.value !== 'AS') break;
        j++;
        if (tokens[j]?.value === 'NOT' || tokens[j]?.value === 'MATERIALIZED') j++;
        if (tokens[j]?.value === 'MATERIALIZED') j++;
        if (tokens[j]?.value !== '(') break;

        let level = 0;
        for (; j < tokens.length; j++) {
          if (tokens[j].value === '(') level++;
          if (tokens[j].value === ')' && --level === 0) {
            j++;
            break;
          }
        }

        if (tokens[j]?.value === ',') j++;
        else break;
      }
      continue;
    }

    if (token.value === 'FROM' || token.value === 'JOIN') {
      const previous = tokens[i - 1];
      const isFunctionFrom = functionParen[depth] === true;
      const isDistinctFrom = previous?.type === 'word' && previous.value === 'DISTINCT';

      if (isFunctionFrom || isDistinctFrom) continue;

      if (token.value === 'FROM') fromOpen[depth] = true;

      // LATERAL and ONLY are modifiers, not names.
      let next = i + 1;
      if (tokens[next]?.type === 'word' && (tokens[next].value === 'LATERAL' || tokens[next].value === 'ONLY')) {
        next++;
      }

      if (tokens[next]?.value === '(') continue; // subquery: handled when its own FROM appears
      i = readTableName(next) - 1;
      continue;
    }

    if (fromOpen[depth] && FROM_END.has(token.value)) {
      fromOpen[depth] = false;
    }
  }

  return {
    tables: [...tables].filter((name) => !ctes.has(name)),
    ctes: [...ctes],
  };
}

export interface PlanSqlCheck {
  ok: boolean;
  /** Tables used by the SQL that the plan does not list. */
  unplanned: string[];
}

/** The SQL may only read tables that the accepted plan listed. */
export function checkSqlFollowsPlan(
  sql: string,
  plan: StructuredQueryPlan,
  dialect: SqlDialect,
): PlanSqlCheck {
  const planned = new Set(
    plan.tables.flatMap((table) => {
      const name = lower(table);
      const dot = name.lastIndexOf('.');
      return dot === -1 ? [name] : [name, name.slice(dot + 1)];
    }),
  );

  const { tables } = extractTableReferences(sql, dialect);
  const unplanned = tables.filter((name) => !planned.has(name));

  return { ok: unplanned.length === 0, unplanned };
}
