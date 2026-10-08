import type { DatabaseAdapter, TableInfo, TableSchema, RelationshipInfo } from '../core/types/index.js';

export interface SchemaCacheOptions {
  ttlMs?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Process-local cache for database metadata. It never caches query results.
 * A short TTL keeps repeated agent schema discovery from repeatedly hitting
 * information_schema while allowing schema changes to become visible.
 */
export class SchemaCache {
  private readonly ttlMs: number;
  private tables?: CacheEntry<TableInfo[]>;
  private relationships?: CacheEntry<RelationshipInfo[]>;
  private readonly tableSchemas = new Map<string, CacheEntry<TableSchema>>();

  constructor(options: SchemaCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 300_000;
  }

  async listTables(database: DatabaseAdapter): Promise<TableInfo[]> {
    const cached = this.get(this.tables);
    if (cached) return cached;

    const value = await database.listTables();
    this.tables = this.entry(value);
    return value;
  }

  async describeTable(database: DatabaseAdapter, table: string): Promise<TableSchema> {
    const key = table.toLowerCase();
    const cached = this.get(this.tableSchemas.get(key));
    if (cached) return cached;

    const value = await database.describeTable(table);
    this.tableSchemas.set(key, this.entry(value));
    return value;
  }

  async describeTables(database: DatabaseAdapter, tables: string[]): Promise<TableSchema[]> {
    return Promise.all(tables.map((table) => this.describeTable(database, table)));
  }

  async getRelationships(database: DatabaseAdapter): Promise<RelationshipInfo[]> {
    const cached = this.get(this.relationships);
    if (cached) return cached;

    const value = await database.getRelationships();
    this.relationships = this.entry(value);
    return value;
  }

  clear(): void {
    this.tables = undefined;
    this.relationships = undefined;
    this.tableSchemas.clear();
  }

  private entry<T>(value: T): CacheEntry<T> {
    return { value, expiresAt: Date.now() + this.ttlMs };
  }

  private get<T>(entry: CacheEntry<T> | undefined): T | undefined {
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.value;
  }
}
