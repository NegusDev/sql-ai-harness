import 'dotenv/config';
import { z } from 'zod';
import type { SqlSafetyPolicy } from '../core/types/index.js';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  AI_MODEL: z.string().min(1, 'AI_MODEL is required'),
  AI_SITE_URL: z
    .string()
      .url()
      .optional()
      .or(z.literal('')),
  AI_SITE_NAME: z.string().default('SQL AI Harness'),

  DB_DRIVER: z.enum(['mysql', 'postgres', 'sqlite']).default('mysql'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default(''),
  DB_USER: z.string().default(''),
  DB_PASSWORD: z.string().default(''),

  SQL_MAX_ROWS: z.coerce.number().int().positive().default(500),
  SQL_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  SQL_MAX_RESULT_BYTES: z.coerce.number().int().positive().default(1_048_576),
  AGENT_MAX_STEPS: z.coerce.number().int().min(1).max(20).default(8),
  SCHEMA_CACHE_TTL_MS: z.coerce.number().int().positive().default(300_000),
});

export interface AppConfig {
  ai: {
    provider: 'openrouter';
    apiKey: string;
    model: string;
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
  };
  safety: SqlSafetyPolicy;
  agent: {
    maxSteps: number;
  };
  schema: {
    cacheTtlMs: number;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);

  return {
    ai: {
      provider: 'openrouter',
      apiKey: parsed.OPENROUTER_API_KEY,
      model: parsed.AI_MODEL,
      siteUrl: parsed.AI_SITE_URL,
      siteName: parsed.AI_SITE_NAME,
    },
    database: {
      driver: parsed.DB_DRIVER,
      host: parsed.DB_HOST,
      port: parsed.DB_PORT,
      name: parsed.DB_NAME,
      user: parsed.DB_USER,
      password: parsed.DB_PASSWORD,
    },
    agent: {
      maxSteps: parsed.AGENT_MAX_STEPS,
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
