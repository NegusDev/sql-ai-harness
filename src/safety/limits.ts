import type { SqlSafetyPolicy } from '../core/types/index.js';

/**
 * Adds a conservative LIMIT to simple SELECT/WITH queries that do not already
 * have one. Actual row limits should still be enforced by the database adapter.
 */
export function applyRowLimit(sql: string, policy: SqlSafetyPolicy): string {
  const normalized = sql.trim().replace(/;\s*$/, '');

  if (/\bLIMIT\s+\d+/i.test(normalized)) {
    return normalized;
  }

  if (/^(SELECT|WITH)\b/i.test(normalized)) {
    return `${normalized} LIMIT ${policy.maxRows}`;
  }

  return normalized;
}
