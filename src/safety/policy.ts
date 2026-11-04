import type { SqlDialect, SqlSafetyPolicy } from '../core/types/index.js';
import { validateSql, type SqlValidationResult } from './sql-validator.js';

export function validateQuery(
  sql: string,
  policy: SqlSafetyPolicy,
  dialect: SqlDialect = 'mysql',
): SqlValidationResult {
  return validateSql(sql, policy, dialect);
}

export function getQueryExecutionOptions(policy: SqlSafetyPolicy) {
  return {
    maxRows: policy.maxRows,
    timeoutMs: policy.queryTimeoutMs,
  };
}
