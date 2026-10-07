/**
 * Shared domain types. These types deliberately do not depend on a provider,
 * database driver, CLI framework, or HTTP framework.
 */

export type SqlDialect = 'mysql' | 'postgres' | 'sqlite';

export interface ModelRequest {
  system?: string;
  prompt: string;
  tools?: unknown;
  temperature?: number;
  maxSteps?: number;
}

export interface ModelResponse {
  text: string;
  raw?: unknown;
  steps?: number;
  toolCalls?: number;
}

export interface ModelProvider {
  readonly name: string;
  generate(request: ModelRequest): Promise<ModelResponse>;
}

export interface TableInfo {
  name: string;
  schema?: string;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: unknown;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
}

export interface TableSchema {
  table: TableInfo;
  columns: ColumnInfo[];
}

export interface RelationshipInfo {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  constraintName?: string;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

export interface QueryPlan {
  sql: string;
  plan: unknown;
}

export interface DatabaseAdapter {
  readonly dialect: SqlDialect;
  listTables(): Promise<TableInfo[]>;
  describeTable(table: string): Promise<TableSchema>;
  getRelationships(table?: string): Promise<RelationshipInfo[]>;
  executeQuery(sql: string, options?: QueryExecutionOptions): Promise<QueryResult>;
  explainQuery(sql: string): Promise<QueryPlan>;
  close?(): Promise<void>;
}

export interface QueryExecutionOptions {
  maxRows?: number;
  timeoutMs?: number;
  maxResultBytes?: number;
}

export interface SqlSafetyPolicy {
  readOnly: boolean;
  maxRows: number;
  queryTimeoutMs: number;
  maxResultBytes: number;
}

export interface ToolContext {
  database: DatabaseAdapter;
  safety: SqlSafetyPolicy;
}

export interface SqlToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
