import type { SqlToolResult, ToolContext } from '../types/index.js';
import { validateSql } from '../../safety/sql-validator.js';

export interface ExplainQueryInput {
  sql: string;
}

/**
 * Produces a database query plan after passing the SQL through the harness
 * safety boundary.
 */
export async function explainQuery(
  input: ExplainQueryInput,
  context: ToolContext,
): Promise<SqlToolResult> {
  const validation = validateSql(input.sql, context.safety);

  if (!validation.valid || !validation.sql) {
    return {
      success: false,
      error: validation.reason ?? 'SQL query failed validation.',
    };
  }

  if (!/^(SELECT|WITH)\b/i.test(validation.sql)) {
    return {
      success: false,
      error: 'Only SELECT or WITH queries can be explained by this tool.',
    };
  }

  try {
    const result = await context.database.explainQuery(validation.sql);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to explain query.',
    };
  }
}
