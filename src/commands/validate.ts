import { ZodError } from 'zod';
import { loadConfig, type AppConfig } from '../config/config.js';
import { createDatabaseAdapter, isSupportedDriver } from '../database/factory.js';
import { createAiProvider } from '../ai/factory.js';
import type { AiProvider } from '../ai/provider.js';
import { loadDatabaseContext } from '../context/db-context.js';
import type { DatabaseAdapter, DatabaseContext } from '../core/types/index.js';
import { createStyle, plainStyle, type Style } from '../ui/style.js';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface ValidateDependencies {
  loadConfig: () => AppConfig;
  createDatabase: (config: AppConfig['database']) => DatabaseAdapter;
  createProvider: (config: AppConfig['ai']) => AiProvider;
  loadContext: () => Promise<DatabaseContext>;
}

export interface ValidateOptions {
  skipProvider: boolean;
  providerTimeoutMs: number;
}

const DEFAULT_PROVIDER_TIMEOUT_MS = 20_000;

const defaultDependencies: ValidateDependencies = {
  loadConfig: () => loadConfig(),
  createDatabase: (config) => createDatabaseAdapter(config),
  createProvider: createAiProvider,
  loadContext: () => loadDatabaseContext(),
};

function describeError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join('; ');
  }

  return error instanceof Error ? error.message : String(error);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} did not respond within ${Math.round(ms / 1000)}s.`)),
      ms,
    );
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Runs the setup checks in order. Later checks are skipped when an earlier one
 * they depend on has failed, so the output points at the first real problem.
 *
 * Nothing here reads table data or runs model-written SQL.
 */
export async function runValidationChecks(
  options: ValidateOptions,
  deps: ValidateDependencies = defaultDependencies,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const add = (name: string, status: CheckStatus, detail: string): void => {
    results.push({ name, status, detail });
  };

  // 1. Configuration.
  let config: AppConfig | undefined;

  try {
    config = deps.loadConfig();
    add('Configuration', 'pass', `provider=${config.ai.provider}, model=${config.ai.model}`);
  } catch (error) {
    add(
      'Configuration',
      'fail',
      `${describeError(error)}. Run "dbask init" to create a .env, or set these variables in your environment.`,
    );
  }

  if (!config) {
    add('Database connection', 'skip', 'Skipped: configuration is invalid.');
    add('Foreign keys', 'skip', 'Skipped: configuration is invalid.');
    add('AI provider', 'skip', 'Skipped: configuration is invalid.');
    add('Business context (sql-ai.md)', 'skip', 'Skipped: configuration is invalid.');
    return results;
  }

  // 2. Database.
  const missing: string[] = [];
  if (!config.database.name) missing.push('DB_NAME');
  if (!config.database.user) missing.push('DB_USER');

  if (!isSupportedDriver(config.database.driver)) {
    add(
      'Database connection',
      'fail',
      `DB_DRIVER=${config.database.driver} is not implemented yet. Supported: mysql, postgres.`,
    );
    add('Foreign keys', 'skip', 'Skipped: no database connection.');
  } else if (missing.length > 0) {
    add('Database connection', 'fail', `${missing.join(' and ')} must be set.`);
    add('Foreign keys', 'skip', 'Skipped: no database connection.');
  } else {
    const database = deps.createDatabase(config.database);

    try {
      const tables = await database.listTables();
      const where = `${config.database.host}:${config.database.port}/${config.database.name}`;

      if (tables.length === 0) {
        add('Database connection', 'warn', `Connected to ${where}, but no tables are visible to this user.`);
      } else {
        add('Database connection', 'pass', `Connected to ${where}; ${tables.length} table${tables.length === 1 ? '' : 's'} visible.`);
      }

      try {
        const relationships = await database.getRelationships();

        if (relationships.length === 0) {
          add(
            'Foreign keys',
            'warn',
            'No declared foreign keys found. The agent relies on them to plan joins; consider describing relationships in sql-ai.md.',
          );
        } else {
          add('Foreign keys', 'pass', `${relationships.length} declared relationship${relationships.length === 1 ? '' : 's'} found.`);
        }
      } catch (error) {
        add('Foreign keys', 'fail', describeError(error));
      }
    } catch (error) {
      add('Database connection', 'fail', describeError(error));
      add('Foreign keys', 'skip', 'Skipped: no database connection.');
    } finally {
      await database.close?.().catch(() => undefined);
    }
  }

  // 3. AI provider: one tiny request that confirms the key, model and network.
  if (options.skipProvider) {
    add('AI provider', 'skip', 'Skipped (--skip-provider). No request was sent.');
  } else {
    try {
      const provider = deps.createProvider(config.ai);
      const response = await withTimeout(
        provider.generate({
          prompt: 'Reply with the single word: ok',
          temperature: 0,
          maxSteps: 1,
        }),
        options.providerTimeoutMs,
        `${config.ai.provider}`,
      );

      if (response.text.trim().length > 0) {
        add('AI provider', 'pass', `${config.ai.provider} answered using model ${config.ai.model}.`);
      } else {
        add('AI provider', 'warn', `${config.ai.provider} responded with empty text. Check that ${config.ai.model} is a chat model.`);
      }
    } catch (error) {
      add('AI provider', 'fail', describeError(error));
    }
  }

  // 4. Optional business context.
  try {
    const context = await deps.loadContext();

    if (context.content) {
      add('Business context (sql-ai.md)', 'pass', `Loaded ${context.content.length} characters from ${context.source ?? 'sql-ai.md'}.`);
    } else {
      add('Business context (sql-ai.md)', 'skip', 'No sql-ai.md found. This is optional.');
    }
  } catch (error) {
    add('Business context (sql-ai.md)', 'fail', describeError(error));
  }

  return results;
}

const SYMBOLS: Record<CheckStatus, string> = {
  pass: '[ok]  ',
  warn: '[warn]',
  fail: '[fail]',
  skip: '[skip]',
};

function symbolFor(status: CheckStatus, style: Style): string {
  if (!style.rich) return style.color ? colorize(status, SYMBOLS[status], style) : SYMBOLS[status];

  const icons: Record<CheckStatus, string> = { pass: '✓', warn: '⚠', fail: '✗', skip: '○' };
  return colorize(status, icons[status], style);
}

function colorize(status: CheckStatus, text: string, style: Style): string {
  if (status === 'pass') return style.green(text);
  if (status === 'warn') return style.yellow(text);
  if (status === 'fail') return style.red(text);
  return style.dim(text);
}

export function formatValidationReport(results: CheckResult[], style: Style = plainStyle): string {
  const lines = results.map(
    (result) =>
      `${symbolFor(result.status, style)} ${style.bold(result.name)}: ${
        result.status === 'skip' ? style.dim(result.detail) : result.detail
      }`,
  );
  const failed = results.filter((result) => result.status === 'fail').length;
  const warned = results.filter((result) => result.status === 'warn').length;

  lines.push('');

  if (failed > 0) {
    lines.push(style.red(`${failed} check${failed === 1 ? '' : 's'} failed. Fix the items marked ${style.rich ? '✗' : '[fail]'} and run validate again.`));
  } else if (warned > 0) {
    lines.push(style.yellow('Ready to use, with warnings above.'));
  } else {
    lines.push(`${style.green('Everything looks good.')} Try: dbask ask "How many rows are in my largest table?"`);
  }

  return lines.join('\n');
}

export function parseValidateArgs(args: string[]): ValidateOptions {
  const options: ValidateOptions = {
    skipProvider: false,
    providerTimeoutMs: DEFAULT_PROVIDER_TIMEOUT_MS,
  };

  for (const arg of args) {
    if (arg === '--skip-provider') {
      options.skipProvider = true;
      continue;
    }

    throw new Error(`Unknown option for validate: ${arg}`);
  }

  return options;
}

export async function runValidate(args: string[]): Promise<void> {
  const options = parseValidateArgs(args);
  const results = await runValidationChecks(options);

  console.log(formatValidationReport(results, createStyle(process.stdout)));

  if (results.some((result) => result.status === 'fail')) {
    process.exitCode = 1;
  }
}
