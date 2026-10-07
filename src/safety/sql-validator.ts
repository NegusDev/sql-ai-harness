import type { SqlSafetyPolicy } from '../core/types/index.js';

const BLOCKED_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|MERGE|GRANT|REVOKE|CALL|SET|USE|LOAD|HANDLER|LOCK|UNLOCK)\b/i;
const MULTI_STATEMENT = /;\s*\S/;
const LEADING_COMMENT = /^(?:\s*(?:--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/))*\s*/;

export interface SqlValidationResult {
  valid: boolean;
  sql?: string;
  reason?: string;
}

/**
 * First-stage SQL safety boundary.
 *
 * This intentionally rejects anything that is not clearly read-oriented.
 * It is not intended to be a complete SQL parser; the database account should
 * also be configured with read-only privileges.
 */
export function validateSql(sql: string, policy: SqlSafetyPolicy): SqlValidationResult {
  const normalized = sql.trim();

  if (!normalized) {
    return { valid: false, reason: 'SQL query is empty.' };
  }

  const withoutLeadingComments = normalized.replace(LEADING_COMMENT, '');

  if (!/^(SELECT|WITH|EXPLAIN|SHOW|DESCRIBE|DESC)\b/i.test(withoutLeadingComments)) {
    return { valid: false, reason: 'Only read-oriented SQL statements are allowed.' };
  }

  if (policy.readOnly && BLOCKED_KEYWORDS.test(withoutLeadingComments)) {
    return { valid: false, reason: 'The query contains a blocked SQL operation.' };
  }

  if (MULTI_STATEMENT.test(normalized)) {
    return { valid: false, reason: 'Multiple SQL statements are not allowed.' };
  }

  return {
    valid: true,
    sql: normalized.replace(/;\s*$/, ''),
  };
}
