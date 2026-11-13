
import 'dotenv/config';
import { z } from 'zod';
import type { DatabaseSslMode, SqlSafetyPolicy } from '../core/types/index.js';

const providerSchema = z.enum([
  'openrouter',
  'groq',
  'google',
  'cerebras',
  'ollama',
  'deepseek',
]);

export type AiProviderName = z.infer<typeof providerSchema>;

const envSchema = z.object({
  AI_PROVIDER: providerSchema.default('openrouter'),
  AI_MODEL: z.string().min(1, 'AI_MODEL is required'),

  OPENROUTER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434/v1'),

  AI_SITE_URL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().url().optional(),
  ),
  AI_SITE_NAME: z.string().default('SQL AI Harness'),

  DB_DRIVER: z.enum(['mysql', 'postgres', 'sqlite']).default('mysql'),
  DB_HOST: z.string().default('127.0.0.1'),
  // Empty means "use the driver's default port" (3306 / 5432).
  DB_PORT: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.coerce.number().int().min(1).max(65535).optional(),
  ),
  DB_NAME: z.string().default(''),
  DB_USER: z.string().default(''),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: z.enum(['disable', 'require', 'verify-full']).default('disable'),

  SQL_MAX_ROWS: z.coerce.number().int().positive().default(500),
  SQL_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  SQL_MAX_RESULT_BYTES: z.coerce.number().int().positive().default(1_048_576),
  AGENT_MAX_STEPS: z.coerce.number().int().min(1).max(20).default(8),
  // "on" makes the agent submit a schema-checked query plan before running SQL.
  AGENT_QUERY_PLAN: z.enum(['on', 'off']).default('off'),
  SCHEMA_CACHE_TTL_MS: z.coerce.number().int().positive().default(300_000),
});

export interface AppConfig {
  ai: {
    provider: AiProviderName;
    apiKey?: string;
    model: string;
    baseUrl?: string;
    siteUrl?: string;
    siteName: string;
  };
  database: {
    driver: 'mysql' | 'postgres' | 'sqlite';
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: DatabaseSslMode;
  };
  safety: SqlSafetyPolicy;
  agent: {
    maxSteps: number;
    queryPlan: boolean;
  };
  schema: {
    cacheTtlMs: number;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);

  const apiKeys: Record<AiProviderName, string | undefined> = {
    openrouter: parsed.OPENROUTER_API_KEY,
    groq: parsed.GROQ_API_KEY,
    google: parsed.GOOGLE_GENERATIVE_AI_API_KEY,
    cerebras: parsed.CEREBRAS_API_KEY,
    ollama: undefined,
    deepseek: parsed.DEEPSEEK_API_KEY,
  };

  const apiKey = apiKeys[parsed.AI_PROVIDER];

  if (parsed.AI_PROVIDER !== 'ollama' && !apiKey?.trim()) {
    const envNames: Record<Exclude<AiProviderName, 'ollama'>, string> = {
      openrouter: 'OPENROUTER_API_KEY',
      groq: 'GROQ_API_KEY',
      google: 'GOOGLE_GENERATIVE_AI_API_KEY',
      cerebras: 'CEREBRAS_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
    };

    throw new Error(
      `${envNames[parsed.AI_PROVIDER]} is required when AI_PROVIDER=${parsed.AI_PROVIDER}`,
    );
  }

  return {
    ai: {
      provider: parsed.AI_PROVIDER,
      apiKey,
      model: parsed.AI_MODEL,
      baseUrl: parsed.AI_PROVIDER === 'ollama'
        ? parsed.OLLAMA_BASE_URL
        : undefined,
      siteUrl: parsed.AI_SITE_URL,
      siteName: parsed.AI_SITE_NAME,
    },
    database: {
      driver: parsed.DB_DRIVER,
      host: parsed.DB_HOST,
      port: parsed.DB_PORT ?? (parsed.DB_DRIVER === 'postgres' ? 5432 : 3306),
      name: parsed.DB_NAME,
      user: parsed.DB_USER,
      password: parsed.DB_PASSWORD,
      ssl: parsed.DB_SSL,
    },
    agent: {
      maxSteps: parsed.AGENT_MAX_STEPS,
      queryPlan: parsed.AGENT_QUERY_PLAN === 'on',
    },
    schema: {
      cacheTtlMs: parsed.SCHEMA_CACHE_TTL_MS,
    },
    safety: {
      readOnly: true,
      maxRows: parsed.SQL_MAX_ROWS,
      queryTimeoutMs: parsed.SQL_QUERY_TIMEOUT_MS,
      maxResultBytes: parsed.SQL_MAX_RESULT_BYTES,
    },
  };
}
