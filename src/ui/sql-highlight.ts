import type { Style } from './style.js';

const KEYWORDS = new Set([
  'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS',
  'ON', 'USING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'ILIKE', 'BETWEEN', 'EXISTS',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'WITH', 'RECURSIVE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG',
  'MIN', 'MAX', 'COALESCE', 'CAST', 'EXTRACT', 'OVER', 'PARTITION', 'TRUE', 'FALSE', 'INTERVAL',
]);

// Strings, quoted identifiers and comments first so keywords inside them are left alone.
const TOKEN =
  /('(?:[^'\\]|\\.|'')*')|(`[^`]*`|"[^"]*")|(--[^\n]*|\/\*[\s\S]*?\*\/)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

/** Adds color to SQL. Stripping the ANSI codes always gives back the input. */
export function highlightSql(sql: string, style: Style): string {
  if (!style.color) return sql;

  return sql.replace(TOKEN, (match, str, quoted, comment, num, word) => {
    if (str) return style.green(match);
    if (quoted) return match;
    if (comment) return style.dim(match);
    if (num) return style.yellow(match);
    if (word && KEYWORDS.has(String(word).toUpperCase())) return style.magenta(match);
    return match;
  });
}
