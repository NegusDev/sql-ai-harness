import type { SqlToolResult, ToolContext } from '../types/index.js';
import { validateSql } from '../../safety/sql-validator.js';

export interface ExecuteQueryInput {
  sql: string;
}

export async function executeQuery(
  input: ExecuteQueryInput,
  context: ToolContext,
): Promise<SqlToolResult> {
  const validation = validateSql(input.sql, context.safety);

  if (!validation.valid || !validation.sql) {
    return {
      success: false,
      error: validation.reason ?? 'SQL query failed validation.',
    };
  }

  try {
    const result = await context.database.executeQuery(validation.sql, {
      maxRows: context.safety.maxRows,
      timeoutMs: context.safety.queryTimeoutMs,
      maxResultBytes: context.safety.maxResultBytes,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute query.',
    };
  }
}
