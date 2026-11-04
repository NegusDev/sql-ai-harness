/**
 * Shared by database adapters: keeps a result within the configured row and
 * byte limits and reports whether anything was left out.
 */
export interface LimitedRows {
  rows: Record<string, unknown>[];
  truncated: boolean;
}

/**
 * @param rows        Rows fetched from the database. May contain one more row
 *                    than `maxRows` so truncation can be detected without
 *                    reading the whole result.
 * @param maxRows     Maximum number of rows to return.
 * @param maxBytes    Maximum size of the JSON-serialized rows.
 */
export function limitRows(
  rows: Record<string, unknown>[],
  maxRows: number,
  maxBytes: number,
): LimitedRows {
  let truncated = rows.length > maxRows;
  const capped = truncated ? rows.slice(0, maxRows) : rows;

  if (Buffer.byteLength(JSON.stringify(capped), 'utf8') <= maxBytes) {
    return { rows: capped, truncated };
  }

  const kept: Record<string, unknown>[] = [];
  let size = 2; // "[]"

  for (const row of capped) {
    const rowSize =
      Buffer.byteLength(JSON.stringify(row), 'utf8') + (kept.length > 0 ? 1 : 0);

    if (size + rowSize > maxBytes) break;

    kept.push(row);
    size += rowSize;
  }

  truncated = true;
  return { rows: kept, truncated };
}
