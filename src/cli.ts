#!/usr/bin/env node

import { Agent } from './core/agent/index.js';
import { loadConfig } from './config/config.js';
import { MySqlAdapter } from './database/index.js';
import { OpenRouterProvider } from './ai/openrouter.js';

function printUsage(): void {
  console.log(`Usage:\n  pnpm dev ask "your question"`);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (command !== 'ask') {
    printUsage();
    process.exitCode = command ? 1 : 0;
    return;
  }

  const question = args.join(' ').trim();
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
  const agent = new Agent(
    provider,
    {
      database,
      safety: config.safety,
    },
    {
      maxSteps: config.agent.maxSteps,
    },
  );

  try {
    const result = await agent.ask(question);
    console.log('\n' + result.text);
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
