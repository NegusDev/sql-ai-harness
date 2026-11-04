import { describe, expect, it } from 'vitest';
import { limitRows } from '../src/database/result-limits.js';

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i, v: 'x'.repeat(20) }));

describe('limitRows', () => {
  it('returns everything when within limits', () => {
    expect(limitRows(rows(3), 10, 10_000)).toEqual({ rows: rows(3), truncated: false });
  });

  it('is not truncated when exactly maxRows', () => {
    expect(limitRows(rows(5), 5, 10_000).truncated).toBe(false);
  });

  it('truncates when the fetch contains more than maxRows', () => {
    const r = limitRows(rows(6), 5, 10_000);
    expect(r.rows).toHaveLength(5);
    expect(r.truncated).toBe(true);
  });

  it('enforces the byte cap and flags truncation', () => {
    const r = limitRows(rows(100), 100, 200);
    expect(r.truncated).toBe(true);
    expect(r.rows.length).toBeGreaterThan(0);
    expect(Buffer.byteLength(JSON.stringify(r.rows), 'utf8')).toBeLessThanOrEqual(200);
  });

  it('returns no rows when a single row exceeds the byte cap', () => {
    const r = limitRows(rows(2), 10, 10);
    expect(r).toEqual({ rows: [], truncated: true });
  });
});
