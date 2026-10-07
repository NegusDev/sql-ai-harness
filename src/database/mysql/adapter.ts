import mysql, { type Pool, type PoolOptions, type RowDataPacket } from 'mysql2/promise';
import type {
  ColumnInfo,
  DatabaseAdapter,
  QueryExecutionOptions,
  QueryPlan,
  QueryResult,
  RelationshipInfo,
  TableInfo,
  TableSchema,
} from '../../core/types/index.js';

export interface MySqlAdapterConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit?: number;
}

export class MySqlAdapter implements DatabaseAdapter {
  readonly dialect = 'mysql' as const;
  private readonly pool: Pool;

  constructor(config: MySqlAdapterConfig) {
    const options: PoolOptions = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      connectionLimit: config.connectionLimit ?? 5,
      waitForConnections: true,
      enableKeepAlive: true,
    };

    this.pool = mysql.createPool(options);
  }

  async listTables(): Promise<TableInfo[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `
      SELECT TABLE_NAME AS table_name
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME ASC
      `,
    );

    return rows.map((row) => ({ name: String(row.table_name) }));
  }

  async describeTable(table: string): Promise<TableSchema> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `
      SELECT
        COLUMN_NAME AS column_name,
        DATA_TYPE AS data_type,
        IS_NULLABLE AS is_nullable,
        COLUMN_DEFAULT AS column_default,
        COLUMN_KEY AS column_key,
        EXTRA AS extra
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION ASC
      `,
      [table],
    );

    if (rows.length === 0) {
      throw new Error(`Table "${table}" was not found in the current database.`);
    }

    const columns: ColumnInfo[] = rows.map((row) => ({
      name: String(row.column_name),
      dataType: String(row.data_type),
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.column_key === 'PRI',
      isAutoIncrement: String(row.extra ?? '').toLowerCase().includes('auto_increment'),
    }));

    return {
      table: { name: table },
      columns,
    };
  }

  async getRelationships(table?: string): Promise<RelationshipInfo[]> {
    const conditions = [
      'TABLE_SCHEMA = DATABASE()',
      'REFERENCED_TABLE_SCHEMA = DATABASE()',
    ];
    const params: string[] = [];

    if (table) {
      conditions.push('TABLE_NAME = ?');
      params.push(table);
    }

    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `
      SELECT
        TABLE_NAME AS table_name,
        COLUMN_NAME AS column_name,
        REFERENCED_TABLE_NAME AS referenced_table,
        REFERENCED_COLUMN_NAME AS referenced_column,
        CONSTRAINT_NAME AS constraint_name
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE ${conditions.join(' AND ')}
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME ASC, COLUMN_NAME ASC
      `,
      params,
    );

    return rows.map((row) => ({
      table: String(row.table_name),
      column: String(row.column_name),
      referencedTable: String(row.referenced_table),
      referencedColumn: String(row.referenced_column),
      constraintName: String(row.constraint_name),
    }));
  }

  async executeQuery(sql: string, options: QueryExecutionOptions = {}): Promise<QueryResult> {
    const maxRows = options.maxRows ?? 500;
    const timeoutMs = options.timeoutMs ?? 10_000;
    const maxResultBytes = options.maxResultBytes ?? 1_048_576;
    const startedAt = performance.now();

    // mysql2 supports a client-side timeout for text queries.
    const [rawRows] = await this.pool.query({
      sql,
      timeout: timeoutMs,
    });

    const rows = Array.isArray(rawRows)
      ? (rawRows as RowDataPacket[]).slice(0, maxRows).map((row) => ({ ...row }))
      : [];

    const serialized = JSON.stringify(rows);

    if (Buffer.byteLength(serialized, 'utf8') > maxResultBytes) {
      const limitedRows: Record<string, unknown>[] = [];
      let size = 2;

      for (const row of rows) {
        const rowJson = JSON.stringify(row);
        const rowSize = Buffer.byteLength(rowJson, 'utf8') + (limitedRows.length > 0 ? 1 : 0);

        if (size + rowSize > maxResultBytes) break;

        limitedRows.push(row);
        size += rowSize;
      }

      return {
        rows: limitedRows,
        rowCount: limitedRows.length,
        executionTimeMs: Math.round(performance.now() - startedAt),
      };
    }

    return {
      rows,
      rowCount: rows.length,
      executionTimeMs: Math.round(performance.now() - startedAt),
    };
  }

  async explainQuery(sql: string): Promise<QueryPlan> {
    const [rows] = await this.pool.query<RowDataPacket[]>({
      sql: `EXPLAIN ${sql}`,
      timeout: 10_000,
    });

    return {
      sql,
      plan: rows,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
