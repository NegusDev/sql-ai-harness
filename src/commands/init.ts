import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readFile, writeFile, access, chmod } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { MySqlAdapter } from '../database/mysql/adapter.js';
import type { AiProviderName } from '../config/config.js';

const PROVIDERS: Array<{ value: AiProviderName; label: string; model: string }> = [
  { value: 'openrouter', label: 'OpenRouter', model: '' },
  { value: 'google', label: 'Google Gemini', model: '' },
  { value: 'groq', label: 'Groq', model: '' },
  { value: 'cerebras', label: 'Cerebras', model: '' },
  { value: 'ollama', label: 'Ollama (local)', model: 'qwen2.5:7b' },
];

function required(value: string, label: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${label} is required.`);
  return clean;
}

async function askSecret(question: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    const rl = createInterface({ input: stdin, output: stdout });
    try { return await rl.question(`${question}: `); } finally { rl.close(); }
  }

  stdout.write(`${question}: `);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  return new Promise((resolvePromise, reject) => {
    let value = '';
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\u0003') {
          cleanup(); stdout.write('\n'); reject(new Error('Setup cancelled.')); return;
        }
        if (char === '\r' || char === '\n') {
          cleanup(); stdout.write('\n'); resolvePromise(value); return;
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function askChoice<T extends string>(
  rl: ReturnType<typeof createInterface>,
  question: string,
  options: Array<{ value: T; label: string }>,
): Promise<T> {
  stdout.write(`\n${question}\n`);
  options.forEach((option, index) => stdout.write(`  ${index + 1}. ${option.label}\n`));
  while (true) {
    const answer = (await rl.question(`Choose 1-${options.length} [1]: `)).trim() || '1';
    const index = Number(answer) - 1;
    if (Number.isInteger(index) && options[index]) return options[index].value;
    stdout.write(`Enter a number from 1 to ${options.length}.\n`);
  }
}

async function askValue(
  rl: ReturnType<typeof createInterface>,
  label: string,
  defaultValue: string,
): Promise<string> {
  const answer = (await rl.question(`${label} [${defaultValue}]: `)).trim();
  return answer || defaultValue;
}

function dotenvValue(value: string): string {
  return value === '' ? '' : JSON.stringify(value);
}

async function saveEnvFile(path: string, values: Record<string, string>): Promise<void> {
  let existing = '';
  try { existing = await readFile(path, 'utf8'); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const lines = existing.split(/\r?\n/);
  const output: string[] = [];
  const written = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/);
    const key = match?.[1];
    if (key && Object.hasOwn(values, key)) {
      if (!written.has(key)) output.push(`${key}=${dotenvValue(values[key]!)}`);
      written.add(key);
    } else {
      output.push(line);
    }
  }
  const additions = Object.entries(values)
    .filter(([key]) => !written.has(key))
    .map(([key, value]) => `${key}=${dotenvValue(value)}`);
  const merged = [...output.filter((line, index, all) => line !== '' || index < all.length - 1), ...additions].join('\n').replace(/\n*$/, '\n');
  await writeFile(path, merged, { encoding: 'utf8', mode: 0o600 });
  await chmod(path, 0o600);
}

export async function runInit(args: string[] = []): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('The init command requires an interactive terminal. Configure environment variables for non-interactive use.');
  }
  const force = args.includes('--force');
  const envPath = resolve(process.cwd(), '.env');
  try {
    await access(envPath, constants.F_OK);
    if (!force) {
      const check = createInterface({ input: stdin, output: stdout });
      const answer = (await check.question('A .env file already exists. Continue and add harness settings? (y/N): ')).trim().toLowerCase();
      check.close();
      if (answer !== 'y' && answer !== 'yes') throw new Error('Setup cancelled. Existing .env file was not changed. Use --force to update harness settings.');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  let rl = createInterface({ input: stdin, output: stdout });
  const values: Record<string, string> = {
    DB_DRIVER: 'mysql',
    DB_HOST: '127.0.0.1',
    DB_PORT: '3306',
    DB_NAME: '',
    DB_USER: '',
    DB_PASSWORD: '',
    AI_PROVIDER: 'openrouter',
    AI_MODEL: '',
    OPENROUTER_API_KEY: '',
    GROQ_API_KEY: '',
    GOOGLE_GENERATIVE_AI_API_KEY: '',
    CEREBRAS_API_KEY: '',
    OLLAMA_BASE_URL: 'http://localhost:11434/v1',
    AI_SITE_NAME: 'SQL AI Harness',
    SQL_MAX_ROWS: '500',
    SQL_QUERY_TIMEOUT_MS: '10000',
    SQL_MAX_RESULT_BYTES: '1048576',
    AGENT_MAX_STEPS: '8',
    SCHEMA_CACHE_TTL_MS: '300000',
  };

  try {
    stdout.write('\nSQL AI Harness — Setup\n\nDatabase\n');
    values.DB_HOST = await askValue(rl, 'MySQL/MariaDB host', '127.0.0.1');
    values.DB_PORT = await askValue(rl, 'Port', '3306');
    if (!/^\d+$/.test(values.DB_PORT) || Number(values.DB_PORT) < 1 || Number(values.DB_PORT) > 65535) {
      throw new Error('Database port must be a number between 1 and 65535.');
    }
    values.DB_NAME = required(await askValue(rl, 'Database name', ''), 'Database name');
    values.DB_USER = required(await askValue(rl, 'Database username', ''), 'Database username');
    rl.close();
    values.DB_PASSWORD = await askSecret('Database password');
    rl = createInterface({ input: stdin, output: stdout });

    const provider = await askChoice(rl, 'AI provider', PROVIDERS.map(({ value, label }) => ({ value, label })));
    values.AI_PROVIDER = provider;
    const providerInfo = PROVIDERS.find((item) => item.value === provider)!;
    values.AI_MODEL = required(await rl.question('Model ID (enter the exact model identifier supported by this provider): '), 'Model ID');

    if (provider !== 'ollama') {
      const keyNames: Record<Exclude<AiProviderName, 'ollama'>, string> = {
        openrouter: 'OPENROUTER_API_KEY',
        google: 'GOOGLE_GENERATIVE_AI_API_KEY',
        groq: 'GROQ_API_KEY',
        cerebras: 'CEREBRAS_API_KEY',
      };
      rl.close();
      values[keyNames[provider]] = required(await askSecret(`${providerInfo.label} API key`), 'API key');
      rl = createInterface({ input: stdin, output: stdout });
    } else {
      values.OLLAMA_BASE_URL = await askValue(rl, 'Ollama OpenAI-compatible base URL', 'http://localhost:11434/v1');
      try { new URL(values.OLLAMA_BASE_URL); } catch { throw new Error('Ollama base URL must be a valid URL.'); }
    }

    values.AGENT_MAX_STEPS = await askValue(rl, 'Maximum agent steps', '8');
    values.SQL_MAX_ROWS = await askValue(rl, 'Maximum rows returned', '500');
    values.SCHEMA_CACHE_TTL_MS = String(Number(await askValue(rl, 'Schema cache TTL in minutes', '5')) * 60_000);
    if (!/^\d+$/.test(values.AGENT_MAX_STEPS) || Number(values.AGENT_MAX_STEPS) < 1 || Number(values.AGENT_MAX_STEPS) > 20) {
      throw new Error('Maximum agent steps must be between 1 and 20.');
    }
    if (!/^\d+$/.test(values.SQL_MAX_ROWS) || Number(values.SQL_MAX_ROWS) < 1) {
      throw new Error('Maximum rows returned must be a positive integer.');
    }
    if (!/^\d+$/.test(values.SCHEMA_CACHE_TTL_MS) || Number(values.SCHEMA_CACHE_TTL_MS) < 60_000) {
      throw new Error('Schema cache TTL must be at least 1 minute.');
    }

    stdout.write('\nTesting MySQL/MariaDB connection...\n');
    const database = new MySqlAdapter({
      host: values.DB_HOST!, port: Number(values.DB_PORT), database: values.DB_NAME!,
      user: values.DB_USER!, password: values.DB_PASSWORD!,
    });
    try {
      const tables = await database.listTables();
      stdout.write(`✓ Database connection successful (${tables.length} tables discovered).\n`);
    } finally {
      await database.close();
    }

    // Keep only the selected provider's secret key in the generated configuration.
    const selectedKey = provider === 'ollama' ? undefined : ({
      openrouter: 'OPENROUTER_API_KEY', google: 'GOOGLE_GENERATIVE_AI_API_KEY',
      groq: 'GROQ_API_KEY', cerebras: 'CEREBRAS_API_KEY',
    } as const)[provider];
    for (const key of ['OPENROUTER_API_KEY', 'GROQ_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'CEREBRAS_API_KEY']) {
      if (key !== selectedKey) delete values[key];
    }
    await saveEnvFile(envPath, values);
    stdout.write(`\n✓ Configuration saved to ${envPath}\n`);
    stdout.write('  Keep .env out of version control; it contains credentials.\n\nSetup complete. Try:\n  sql-ai-harness ask "How many records are in the database?"\n\n');
  } finally {
    rl.close();
  }
}
