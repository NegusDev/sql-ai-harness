import type { SqlToolResult, ToolContext } from '../types/index.js';
import { describeTable, type DescribeTableInput } from './describe-table.js';
import { describeTables, type DescribeTablesInput } from './describe-tables.js';
import { executeQuery, type ExecuteQueryInput } from './execute-query.js';
import { explainQuery, type ExplainQueryInput } from './explain-query.js';
import { getRelationships, type GetRelationshipsInput } from './get-relationships.js';
import { listTables } from './list-tables.js';

export type ToolName =
  | 'list_tables'
  | 'describe_table'
  | 'describe_tables'
  | 'get_relationships'
  | 'execute_query'
  | 'explain_query';

export interface RegisteredTool {
  name: ToolName;
  description: string;
  execute: (input: unknown, context: ToolContext) => Promise<SqlToolResult>;
}

const tools: Record<ToolName, RegisteredTool> = {
  list_tables: {
    name: 'list_tables',
    description: 'List the tables available in the connected database.',
    execute: (_input, context) => listTables(context),
  },
  describe_table: {
    name: 'describe_table',
    description: 'Inspect the columns and basic schema information for a database table.',
    execute: (input, context) => describeTable(input as DescribeTableInput, context),
  },
  describe_tables: {
    name: 'describe_tables',
    description: 'Inspect columns and basic schema information for multiple database tables at once. Use this when several tables are relevant.',
    execute: (input, context) => describeTables(input as DescribeTablesInput, context),
  },
  get_relationships: {
    name: 'get_relationships',
    description: 'List foreign-key relationships in the connected database, optionally for one table.',
    execute: (input, context) => getRelationships((input ?? {}) as GetRelationshipsInput, context),
  },
  execute_query: {
    name: 'execute_query',
    description: 'Execute a validated read-only SQL query against the connected database.',
    execute: (input, context) => executeQuery(input as ExecuteQueryInput, context),
  },
  explain_query: {
    name: 'explain_query',
    description: 'Return the database execution plan for a validated SELECT or WITH query.',
    execute: (input, context) => explainQuery(input as ExplainQueryInput, context),
  },
};

export function getTool(name: ToolName): RegisteredTool {
  return tools[name];
}

export function getTools(): RegisteredTool[] {
  return Object.values(tools);
}

export async function executeTool(
  name: ToolName,
  input: unknown,
  context: ToolContext,
): Promise<SqlToolResult> {
  return getTool(name).execute(input, context);
}
