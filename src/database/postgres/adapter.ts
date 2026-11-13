import pg, { type PoolClient, type PoolConfig } from 'pg';
import Cursor from 'pg-cursor';
import type {
  ColumnInfo,
  DatabaseAdapter,
  DatabaseSslMode,
  QueryExecutionOptions,
  QueryPlan,
  QueryResult,
  RelationshipInfo,
  TableInfo,
  TableSchema,
} from '../../core/types/index.js';
import { limitRows } from '../result-limits.js';

export interface PostgresAdapterConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit?: number;
  /**
   * TLS mode. `require` encrypts without verifying the server certificate
   * (like libpq's sslmode=require); `verify-full` also verifies the
   * certificate chain and host name. Use NODE_EXTRA_CA_CERTS to trust a
   * private CA. Defaults to `disable`.
   */
  ssl?: DatabaseSslMode;
}

const DEFAULT_MAX_ROWS = 500;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESULT_BYTES = 1_048_576;

// OIDs of date/time types. They are returned as the server formats them
// (e.g. "2026-05-11", "2026-05-11 09:51:43") rather than as JS Date objects,
// which keeps results timezone-independent and matches the MySQL adapter.
const RAW_TEXT_TYPE_OIDS = new Set([1082, 1114, 1184]); // date, timestamp, timestamptz

const resultTypes = {
  getTypeParser: ((oid: number, format?: 'text' | 'binary') =>
    RAW_TEXT_TYPE_OIDS.has(oid)
      ? (value: string) => value
      : pg.types.getTypeParser(oid, format)) as never,
};

/** A table name as shown to the model: unqualified when SQL would resolve it. */
function displayName(schema: string, name: string, visible: boolean): string {
  return visible ? name : `${schema}.${name}`;
}

/**
 * Splits "name", "schema.name", or quoted forms ("My Table", "Sales"."Order")
 * into parts. Unquoted parts are kept exactly as given.
 */
function parseQualifiedName(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const c = input[i] as string;

    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (c === '"') {
        quoted = false;
      } else {
        current += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === '.') {
      parts.push(current);
      current = '';
    } else {
      current += c;
    }
  }

  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/** Converts values JSON.stringify would bloat or mangle. */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    out[key] = Buffer.isBuffer(value) ? `\\x${value.toString('hex')}` : value;
  }

  return out;
}

/**
 * PostgreSQL adapter.
 *
 * Safety properties, independent of the SQL validator:
 * - Every statement runs inside `BEGIN READ ONLY`, so the server refuses
 *   writes even if the connected role is allowed to make them. The
 *   transaction is always rolled back.
 * - `statement_timeout` is set per transaction, so slow queries are cancelled
 *   by the server rather than abandoned by the client.
 * - Queries use the extended protocol (via a cursor), so the server itself
 *   rejects multiple statements in one request.
 * - Rows are fetched through the cursor, so at most `maxRows + 1` rows are
 *   ever transferred, however large the result is.
 * - `standard_conforming_strings` is pinned to `on`, which the validator's
 *   tokenizer assumes.
 *
 * A dedicated read-only database role is still recommended.
 */
export class PostgresAdapter implements DatabaseAdapter {
  readonly dialect = 'postgres' as const;
  private readonly pool: pg.Pool;

  constructor(config: PostgresAdapterConfig) {
    const options: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.connectionLimit ?? 5,
      application_name: 'dbask',
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      types: resultTypes,
    };

    if (config.ssl === 'require') {
      options.ssl = { rejectUnauthorized: false };
    } else if (config.ssl === 'verify-full') {
      options.ssl = { rejectUnauthorized: true };
    }

    this.pool = new pg.Pool(options);

    // An idle connection can be dropped by the server or a proxy. Without a
    // handler this 'error' event would crash the process; the pool discards
    // the broken client and the next query opens a new one.
    this.pool.on('error', () => undefined);
  }

  async listTables(): Promise<TableInfo[]> {
    const rows = await this.run<{ schema_name: string; table_name: string; visible: boolean }>(
      `
      SELECT n.nspname AS schema_name,
             c.relname AS table_name,
             pg_table_is_visible(c.oid) AS visible
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p')
        AND NOT c.relispartition
        AND n.nspname <> 'information_schema'
        AND n.nspname NOT LIKE 'pg\\_%'
        AND has_table_privilege(c.oid, 'SELECT')
      ORDER BY n.nspname, c.relname
      `,
    );

    return rows.map((row) => ({
      name: displayName(row.schema_name, row.table_name, row.visible),
      schema: row.schema_name,
    }));
  }

  async describeTable(table: string): Promise<TableSchema> {
    const target = await this.resolveTable(table);

    const rows = await this.run<{
      column_name: string;
      data_type: string;
      nullable: boolean;
      column_default: string | null;
      is_primary_key: boolean;
      is_auto_increment: boolean;
    }>(
      `
      SELECT a.attname AS column_name,
             format_type(a.atttypid, a.atttypmod) AS data_type,
             NOT a.attnotnull AS nullable,
             pg_get_expr(d.adbin, d.adrelid) AS column_default,
             EXISTS (
               SELECT 1 FROM pg_index i
               WHERE i.indrelid = a.attrelid AND i.indisprimary AND a.attnum = ANY (i.indkey)
             ) AS is_primary_key,
             (a.attidentity IN ('a', 'd')
               OR COALESCE(pg_get_expr(d.adbin, d.adrelid), '') LIKE 'nextval(%') AS is_auto_increment
      FROM pg_attribute a
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = $1::oid AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum
      `,
      [target.oid],
    );

    const columns: ColumnInfo[] = rows.map((row) => ({
      name: row.column_name,
      dataType: row.data_type,
      nullable: row.nullable,
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
      isAutoIncrement: row.is_auto_increment,
    }));

    return {
      table: { name: target.display, schema: target.schema },
      columns,
    };
  }

  async getRelationships(table?: string): Promise<RelationshipInfo[]> {
    const target = table ? await this.resolveTable(table) : undefined;

    const rows = await this.run<{
      table_schema: string;
      table_name: string;
      column_name: string;
      ref_schema: string;
      ref_table: string;
      ref_column: string;
      constraint_name: string;
      table_visible: boolean;
      ref_visible: boolean;
    }>(
      `
      SELECT cn.nspname AS table_schema,
             cl.relname AS table_name,
             a.attname AS column_name,
             fn.nspname AS ref_schema,
             fl.relname AS ref_table,
             fa.attname AS ref_column,
             c.conname AS constraint_name,
             pg_table_is_visible(cl.oid) AS table_visible,
             pg_table_is_visible(fl.oid) AS ref_visible
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      JOIN pg_namespace cn ON cn.oid = cl.relnamespace
      JOIN pg_class fl ON fl.oid = c.confrelid
      JOIN pg_namespace fn ON fn.oid = fl.relnamespace
      CROSS JOIN LATERAL unnest(c.conkey, c.confkey) AS k(attnum, fattnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = k.fattnum
      WHERE c.contype = 'f'
        AND c.conparentid = 0
        AND cn.nspname <> 'information_schema'
        AND cn.nspname NOT LIKE 'pg\\_%'
        AND has_table_privilege(cl.oid, 'SELECT')
        AND ($1::oid IS NULL OR c.conrelid = $1::oid)
      ORDER BY cn.nspname, cl.relname, a.attname
      `,
      [target?.oid ?? null],
    );

    return rows.map((row) => ({
      table: displayName(row.table_schema, row.table_name, row.table_visible),
      column: row.column_name,
      referencedTable: displayName(row.ref_schema, row.ref_table, row.ref_visible),
      referencedColumn: row.ref_column,
      constraintName: row.constraint_name,
    }));
  }

  async executeQuery(sql: string, options: QueryExecutionOptions = {}): Promise<QueryResult> {
    const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxResultBytes = options.maxResultBytes ?? DEFAULT_MAX_RESULT_BYTES;
    const startedAt = performance.now();

    const fetched = await this.withReadOnlyTransaction(timeoutMs, async (client) => {
      const cursor = client.query(new Cursor(sql, undefined, { types: resultTypes }));

      // One extra row tells us whether the result was cut off.
      const rows = (await cursor.read(maxRows + 1)) as Record<string, unknown>[];
      await cursor.close();
      return rows;
    });

    const { rows, truncated } = limitRows(fetched.map(normalizeRow), maxRows, maxResultBytes);

    return {
      rows,
      rowCount: rows.length,
      executionTimeMs: Math.round(performance.now() - startedAt),
      truncated,
    };
  }

  async explainQuery(sql: string): Promise<QueryPlan> {
    // Plain EXPLAIN (never ANALYZE): the statement is planned, not executed.
    const rows = await this.withReadOnlyTransaction(DEFAULT_TIMEOUT_MS, async (client) => {
      const cursor = client.query(
        new Cursor(`EXPLAIN (FORMAT JSON) ${sql}`, undefined, { types: resultTypes }),
      );
      const result = (await cursor.read(10)) as Record<string, unknown>[];
      await cursor.close();
      return result;
    });

    return {
      sql,
      plan: rows[0]?.['QUERY PLAN'] ?? rows,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /** Runs a fixed catalog query with bind parameters. */
  private async run<T>(text: string, values: unknown[] = []): Promise<T[]> {
    return this.withReadOnlyTransaction(DEFAULT_TIMEOUT_MS, async (client) => {
      const result = await client.query(text, values);
      return result.rows as T[];
    });
  }

  /**
   * Resolves a name from the model ("users", "Sales.orders", "\"Order Items\"")
   * to a table. Unqualified names resolve the way SQL would (search_path);
   * an exact-case match wins over a lower-case one.
   */
  private async resolveTable(
    input: string,
  ): Promise<{ oid: string; schema: string; display: string }> {
    const parts = parseQualifiedName(input);

    if (parts.length === 0 || parts.length > 2) {
      throw new Error(`Table "${input}" was not found in the current database.`);
    }

    const name = parts[parts.length - 1] as string;
    const schema = parts.length === 2 ? (parts[0] as string) : null;

    const rows = await this.run<{
      oid: string;
      schema_name: string;
      table_name: string;
      visible: boolean;
    }>(
      `
      SELECT c.oid::text AS oid,
             n.nspname AS schema_name,
             c.relname AS table_name,
             pg_table_is_visible(c.oid) AS visible
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p')
        AND c.relname IN ($1::text, lower($1::text))
        AND (($2::text IS NULL AND pg_table_is_visible(c.oid)) OR n.nspname IN ($2::text, lower($2::text)))
        AND has_table_privilege(c.oid, 'SELECT')
      `,
      [name, schema],
    );

    const best =
      rows.find((row) => row.table_name === name && (schema === null || row.schema_name === schema)) ??
      rows[0];

    if (!best) {
      throw new Error(`Table "${input}" was not found in the current database.`);
    }

    return {
      oid: best.oid,
      schema: best.schema_name,
      display: displayName(best.schema_name, best.table_name, best.visible),
    };
  }

  /**
   * Runs `work` inside a READ ONLY transaction with a server-side statement
   * timeout. The transaction is always rolled back. A connection that saw an
   * error is discarded rather than returned to the pool.
   */
  private async withReadOnlyTransaction<T>(
    timeoutMs: number,
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    let discard = false;

    try {
      await client.query('BEGIN READ ONLY');
      await client.query({
        text: `SELECT set_config('statement_timeout', $1, true),
                      set_config('idle_in_transaction_session_timeout', $2, true),
                      set_config('standard_conforming_strings', 'on', true)`,
        values: [String(Math.max(1, Math.floor(timeoutMs))), String(Math.floor(timeoutMs) + 5_000)],
      });

      return await work(client);
    } catch (error) {
      discard = true;
      throw error;
    } finally {
      try {
        await client.query('ROLLBACK');
      } catch {
        discard = true;
      }

      client.release(discard);
    }
  }
}
