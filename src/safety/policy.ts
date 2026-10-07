import type { SqlSafetyPolicy } from '../core/types/index.js';
import { validateSql, type SqlValidationResult } from './sql-validator.js';

export function validateQuery(sql: string, policy: SqlSafetyPolicy): SqlValidationResult {
  return validateSql(sql, policy);
}

export function getQueryExecutionOptions(policy: SqlSafetyPolicy) {
  return {
    maxRows: policy.maxRows,
    timeoutMs: policy.queryTimeoutMs,
  };
}
