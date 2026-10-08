import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadDatabaseContext } from '../src/context/db-context.js';

describe('Database context', () => {
  it('returns empty context when sql-ai.md does not exist', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'sql-ai-context-'));

    try {
      await expect(loadDatabaseContext({ cwd })).resolves.toEqual({});
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('loads user-defined context from sql-ai.md', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'sql-ai-context-'));
    const content = '# Database Context\n\nThis is a school management database.';

    try {
      await writeFile(join(cwd, 'sql-ai.md'), content, 'utf8');

      await expect(loadDatabaseContext({ cwd })).resolves.toMatchObject({
        content,
        source: join(cwd, 'sql-ai.md'),
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('treats an empty sql-ai.md as no context', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'sql-ai-context-'));

    try {
      await writeFile(join(cwd, 'sql-ai.md'), '   \n', 'utf8');
      await expect(loadDatabaseContext({ cwd })).resolves.toEqual({});
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
