import { describe, expect, it, vi } from 'vitest';
import { loadConfig, type AppConfig } from '../src/config/config.js';
import {
  formatValidationReport,
  parseValidateArgs,
  runValidationChecks,
  type ValidateDependencies,
} from '../src/commands/validate.js';
import type { DatabaseAdapter } from '../src/core/types/index.js';
import type { AiProvider } from '../src/ai/provider.js';

const baseEnv = {
  AI_PROVIDER: 'openrouter',
  AI_MODEL: 'test/model',
  OPENROUTER_API_KEY: 'sk-test',
  DB_NAME: 'school',
  DB_USER: 'readonly',
  DB_PASSWORD: 'secret',
};

function config(overrides: Record<string, string> = {}): AppConfig {
  return loadConfig({ ...baseEnv, ...overrides } as NodeJS.ProcessEnv);
}

function fakeDatabase(overrides: Partial<DatabaseAdapter> = {}): DatabaseAdapter {
  return {
    dialect: 'mysql',
    listTables: async () => [{ name: 'students' }, { name: 'classes' }],
    describeTable: async () => {
      throw new Error('not used');
    },
    getRelationships: async () => [
      { table: 'students', column: 'class_id', referencedTable: 'classes', referencedColumn: 'id' },
    ],
    executeQuery: async () => {
      throw new Error('validate must never execute SQL');
    },
    explainQuery: async () => {
      throw new Error('not used');
    },
    close: async () => undefined,
    ...overrides,
  };
}

function fakeProvider(text = 'ok'): AiProvider {
  return {
    name: 'fake',
    generate: vi.fn(async () => ({ text })),
  };
}

function deps(overrides: Partial<ValidateDependencies> = {}): ValidateDependencies {
  return {
    loadConfig: () => config(),
    createDatabase: () => fakeDatabase(),
    createProvider: () => fakeProvider(),
    loadContext: async () => ({}),
    ...overrides,
  };
}

const options = { skipProvider: false, providerTimeoutMs: 1_000 };

function status(results: Awaited<ReturnType<typeof runValidationChecks>>, name: string) {
  return results.find((result) => result.name === name)?.status;
}

describe('runValidationChecks', () => {
  it('passes when everything is configured and reachable', async () => {
    const results = await runValidationChecks(options, deps());

    expect(results.map((result) => result.status)).toEqual([
      'pass', // configuration
      'pass', // database
      'pass', // foreign keys
      'pass', // provider
      'skip', // optional sql-ai.md
    ]);
  });

  it('fails configuration with a readable message and skips the rest', async () => {
    const results = await runValidationChecks(
      options,
      deps({ loadConfig: () => config({ AI_MODEL: '' }) }),
    );

    expect(status(results, 'Configuration')).toBe('fail');
    expect(results[0]?.detail).toContain('AI_MODEL');
    expect(results[0]?.detail).toContain('dbask init');
    expect(status(results, 'Database connection')).toBe('skip');
    expect(status(results, 'AI provider')).toBe('skip');
  });

  it('reports a missing provider API key', async () => {
    const results = await runValidationChecks(
      options,
      deps({
        loadConfig: () => config({ OPENROUTER_API_KEY: '' }),
      }),
    );

    expect(status(results, 'Configuration')).toBe('fail');
    expect(results[0]?.detail).toContain('OPENROUTER_API_KEY');
  });

  it('fails when DB_NAME or DB_USER is missing without attempting a connection', async () => {
    const createDatabase = vi.fn(() => fakeDatabase());
    const results = await runValidationChecks(
      options,
      deps({
        loadConfig: () => config({ DB_NAME: '', DB_USER: '' }),
        createDatabase,
      }),
    );

    expect(status(results, 'Database connection')).toBe('fail');
    expect(results.find((r) => r.name === 'Database connection')?.detail).toContain('DB_NAME');
    expect(createDatabase).not.toHaveBeenCalled();
  });

  it('fails clearly for drivers that are not implemented', async () => {
    const results = await runValidationChecks(
      options,
      deps({ loadConfig: () => config({ DB_DRIVER: 'sqlite' }) }),
    );

    expect(status(results, 'Database connection')).toBe('fail');
    expect(results.find((r) => r.name === 'Database connection')?.detail).toContain('sqlite');
  });

  it('reports a failed database connection and still checks the provider', async () => {
    const results = await runValidationChecks(
      options,
      deps({
        createDatabase: () =>
          fakeDatabase({
            listTables: async () => {
              throw new Error('connect ECONNREFUSED 127.0.0.1:3306');
            },
          }),
      }),
    );

    expect(status(results, 'Database connection')).toBe('fail');
    expect(results.find((r) => r.name === 'Database connection')?.detail).toContain('ECONNREFUSED');
    expect(status(results, 'Foreign keys')).toBe('skip');
    expect(status(results, 'AI provider')).toBe('pass');
  });

  it('warns when no tables are visible', async () => {
    const results = await runValidationChecks(
      options,
      deps({ createDatabase: () => fakeDatabase({ listTables: async () => [] }) }),
    );

    expect(status(results, 'Database connection')).toBe('warn');
  });

  it('warns when no foreign keys are declared', async () => {
    const results = await runValidationChecks(
      options,
      deps({ createDatabase: () => fakeDatabase({ getRelationships: async () => [] }) }),
    );

    expect(status(results, 'Foreign keys')).toBe('warn');
  });

  it('closes the database connection even when a check fails', async () => {
    const close = vi.fn(async () => undefined);
    await runValidationChecks(
      options,
      deps({
        createDatabase: () =>
          fakeDatabase({
            close,
            listTables: async () => {
              throw new Error('boom');
            },
          }),
      }),
    );

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('never executes SQL', async () => {
    const executeQuery = vi.fn(async () => {
      throw new Error('validate must never execute SQL');
    });

    await runValidationChecks(
      options,
      deps({ createDatabase: () => fakeDatabase({ executeQuery }) }),
    );

    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('fails when the provider rejects the request', async () => {
    const results = await runValidationChecks(
      options,
      deps({
        createProvider: () => ({
          name: 'fake',
          generate: async () => {
            throw new Error('401 Invalid API key');
          },
        }),
      }),
    );

    expect(status(results, 'AI provider')).toBe('fail');
    expect(results.find((r) => r.name === 'AI provider')?.detail).toContain('401');
  });

  it('fails when the provider does not respond in time', async () => {
    const results = await runValidationChecks(
      { skipProvider: false, providerTimeoutMs: 20 },
      deps({
        createProvider: () => ({
          name: 'slow',
          generate: () => new Promise(() => undefined),
        }),
      }),
    );

    expect(status(results, 'AI provider')).toBe('fail');
    expect(results.find((r) => r.name === 'AI provider')?.detail).toContain('did not respond');
  });

  it('warns on an empty provider response', async () => {
    const results = await runValidationChecks(
      options,
      deps({ createProvider: () => fakeProvider('   ') }),
    );

    expect(status(results, 'AI provider')).toBe('warn');
  });

  it('does not contact the provider with --skip-provider', async () => {
    const createProvider = vi.fn(() => fakeProvider());
    const results = await runValidationChecks(
      { skipProvider: true, providerTimeoutMs: 1_000 },
      deps({ createProvider }),
    );

    expect(status(results, 'AI provider')).toBe('skip');
    expect(createProvider).not.toHaveBeenCalled();
  });

  it('reports loaded business context', async () => {
    const results = await runValidationChecks(
      options,
      deps({ loadContext: async () => ({ content: '# Rules', source: '/tmp/sql-ai.md' }) }),
    );

    expect(status(results, 'Business context (sql-ai.md)')).toBe('pass');
  });

  it('does not leak secrets into the report', async () => {
    const results = await runValidationChecks(options, deps());
    const report = formatValidationReport(results);

    expect(report).not.toContain('sk-test');
    expect(report).not.toContain('secret');
  });
});

describe('formatValidationReport', () => {
  it('summarizes failures, warnings, and success', () => {
    expect(
      formatValidationReport([{ name: 'A', status: 'fail', detail: 'bad' }]),
    ).toContain('1 check failed');

    expect(
      formatValidationReport([{ name: 'A', status: 'warn', detail: 'hmm' }]),
    ).toContain('with warnings');

    expect(
      formatValidationReport([{ name: 'A', status: 'pass', detail: 'fine' }]),
    ).toContain('Everything looks good');
  });
});

describe('parseValidateArgs', () => {
  it('defaults to checking the provider', () => {
    expect(parseValidateArgs([]).skipProvider).toBe(false);
  });

  it('accepts --skip-provider', () => {
    expect(parseValidateArgs(['--skip-provider']).skipProvider).toBe(true);
  });

  it('rejects unknown options', () => {
    expect(() => parseValidateArgs(['--wat'])).toThrow('Unknown option');
  });
});
