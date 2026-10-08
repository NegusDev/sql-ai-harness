import type { SqlToolResult, ToolContext } from '../types/index.js';

export interface DescribeTablesInput {
  tables: string[];
}

export async function describeTables(
  input: DescribeTablesInput,
  context: ToolContext,
): Promise<SqlToolResult> {
  const tables = [...new Set((input.tables ?? []).map((table) => table.trim()).filter(Boolean))];

  if (tables.length === 0) {
    return { success: false, error: 'At least one table name is required.' };
  }

  if (tables.length > 10) {
    return { success: false, error: 'A maximum of 10 tables can be described at once.' };
  }

  try {
    const schemas = context.schemaCache
      ? await context.schemaCache.describeTables(context.database, tables)
      : await Promise.all(tables.map((table) => context.database.describeTable(table)));

    return { success: true, data: schemas };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to describe tables.',
    };
  }
}
