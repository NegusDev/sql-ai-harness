import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import type { DatabaseContext } from '../core/types/index.js';

export const DEFAULT_DATABASE_CONTEXT_FILE = 'sql-ai.md';

export interface DatabaseContextLoaderOptions {
  cwd?: string;
  fileName?: string;
}

/**
 * Loads optional, user-authored business/domain context for the connected database.
 * Missing context is normal and never prevents the harness from running.
 */
export async function loadDatabaseContext(
  options: DatabaseContextLoaderOptions = {},
): Promise<DatabaseContext> {
  const cwd = options.cwd ?? process.cwd();
  const fileName = options.fileName ?? DEFAULT_DATABASE_CONTEXT_FILE;
  const path = resolve(cwd, fileName);

  try {
    await access(path, constants.R_OK);
    const content = (await readFile(path, 'utf8')).trim();

    if (!content) return {};

    return { content, source: path };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? (error as { code?: string }).code
      : undefined;

    if (code === 'ENOENT') return {};

    throw error;
  }
}
