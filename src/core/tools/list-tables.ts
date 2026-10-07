import type { SqlToolResult, ToolContext } from '../types/index.js';

export async function listTables(context: ToolContext): Promise<SqlToolResult> {
  try {
    const tables = await context.database.listTables();

    return {
      success: true,
      data: tables,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list database tables.',
    };
  }
}
