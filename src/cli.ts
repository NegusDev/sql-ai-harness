#!/usr/bin/env node

import { Agent } from './core/agent/index.js';
import { loadConfig } from './config/config.js';
import { MySqlAdapter } from './database/index.js';
import { OpenRouterProvider } from './ai/openrouter.js';
import { CliAgentObserver } from './cli-observer.js';
import { SchemaCache } from './schema/cache.js';
import type { ResponseMode } from './core/agent/agent.js';
import { loadDatabaseContext } from './context/db-context.js';

function printUsage(): void {
  console.log(`Usage:
  pnpm dev ask [--mode natural|technical|debug] "your question"

Modes:
  natural    Business-friendly answer (default)
  technical  Include useful SQL and technical details
  debug      Technical answer plus tool execution diagnostics`);
}

function parseAskArgs(args: string[]): { mode: ResponseMode; question: string } {
  let mode: ResponseMode = 'natural';
  const questionParts: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--mode') {
      const value = args[++i];
      if (value !== 'natural' && value !== 'technical' && value !== 'debug') {
        throw new Error('Invalid response mode. Use natural, technical, or debug.');
      }
      mode = value;
      continue;
    }

    if (arg === '--technical') {
      mode = 'technical';
      continue;
    }

    if (arg === '--debug') {
      mode = 'debug';
      continue;
    }

    questionParts.push(arg);
  }

  return { mode, question: questionParts.join(' ').trim() };
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (command !== 'ask') {
    printUsage();
    process.exitCode = command ? 1 : 0;
    return;
  }

  const { mode, question } = parseAskArgs(args);
  if (!question) {
    console.error('Error: a question is required.');
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();

  if (config.database.driver !== 'mysql') {
    throw new Error(`Database driver "${config.database.driver}" is not implemented yet. M4 currently supports MySQL.`);
  }

  const database = new MySqlAdapter({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  const provider = new OpenRouterProvider(config.ai);
  const databaseContext = await loadDatabaseContext();
  const schemaCache = new SchemaCache({ ttlMs: config.schema.cacheTtlMs });
  const agent = new Agent(
    provider,
    {
      database,
      safety: config.safety,
      schemaCache,
    },
    {
      maxSteps: config.agent.maxSteps,
      observer: mode === 'debug' ? new CliAgentObserver() : undefined,
      databaseContext,
      responseMode: mode,
    },
  );

  try {
    const result = await agent.ask(question);
    console.log('\n' + result.text);
    if (mode === 'debug') {
      console.error(`\n[agent] ${result.steps} step${result.steps === 1 ? '' : 's'}, ${result.toolCalls} tool call${result.toolCalls === 1 ? '' : 's'}`);
    }
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
