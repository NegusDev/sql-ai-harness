import type { SqlToolResult, ToolContext } from '../types/index.js';

export interface GetRelationshipsInput {
  table?: string;
}

export async function getRelationships(
  input: GetRelationshipsInput = {},
  context: ToolContext,
): Promise<SqlToolResult> {
  const table = input.table?.trim() || undefined;

  try {
    const relationships = table
      ? await context.database.getRelationships(table)
      : context.schemaCache
        ? await context.schemaCache.getRelationships(context.database)
        : await context.database.getRelationships();

    return {
      success: true,
      data: relationships,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to retrieve database relationships.',
    };
  }
}
