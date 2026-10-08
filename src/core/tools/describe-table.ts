import type { SqlToolResult, ToolContext } from '../types/index.js';

export interface DescribeTableInput {
  table: string;
}

export async function describeTable(
  input: DescribeTableInput,
  context: ToolContext,
): Promise<SqlToolResult> {
  const table = input.table.trim();

  if (!table) {
    return {
      success: false,
      error: 'Table name is required.',
    };
  }

  try {
    const schema = context.schemaCache
      ? await context.schemaCache.describeTable(context.database, table)
      : await context.database.describeTable(table);

    return {
      success: true,
      data: schema,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to describe table "${table}".`,
    };
  }
}
