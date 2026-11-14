#!/usr/bin/env node

import { Agent } from './core/agent/index.js';
import { loadConfig } from './config/config.js';
import { createDatabaseAdapter } from './database/index.js';
import { createAiProvider } from './ai/factory.js';
import { CliAgentObserver } from './cli-observer.js';
import { SchemaCache } from './schema/cache.js';
import { createRequire } from 'node:module';
import { parseCli } from './cli-args.js';
import { loadDatabaseContext } from './context/db-context.js';
import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';
import { renderMarkdown } from './ui/markdown.js';
import { Spinner } from './ui/spinner.js';
import { createStyle, terminalWidth } from './ui/style.js';

function printUsage(): void {
  const s = createStyle(process.stdout);
  console.log(`${s.bold('Usage:')}
  dbask "your question" [--mode natural|technical|debug]
  dbask init [--force]
  dbask validate [--skip-provider]
  dbask --version

${s.dim('dbask ask "your question" is the same as dbask "your question".')}

${s.cyan('validate')} checks your configuration, database connection, foreign keys, and sends
one tiny request to the AI provider (use --skip-provider to avoid it). It never
reads table data or runs model-written SQL.

${s.bold('Modes:')}
  ${s.cyan('natural')}    Business-friendly answer (default)
  ${s.cyan('technical')}  Include useful SQL and technical details
  ${s.cyan('debug')}      Technical answer plus tool execution diagnostics`);
}

async function main(): Promise<void> {
  const command = parseCli(process.argv.slice(2));

  switch (command.kind) {
    case 'help':
      printUsage();
      return;
    case 'version':
      console.log(createRequire(import.meta.url)('../package.json').version as string);
      return;
    case 'init':
      await runInit(command.args);
      return;
    case 'validate':
      await runValidate(command.args);
      return;
    case 'error':
      console.error(`${createStyle(process.stderr).red('Error:')} ${command.message}`);
      if (command.showUsage) console.error('Run dbask --help for usage.');
      process.exitCode = 1;
      return;
    case 'ask':
      break;
  }

  const { mode, question } = command;

  const config = loadConfig();
  const errStyle = createStyle(process.stderr);
  const outStyle = createStyle(process.stdout);

  if (errStyle.rich) {
    console.error(
      errStyle.dim(
        `dbask · ${config.ai.provider}/${config.ai.model} · ${config.database.driver}:${config.database.name || 'unnamed'}`,
      ),
    );
  }

  const spinner = new Spinner(process.stderr, errStyle);
  const database = createDatabaseAdapter(config.database);

  const provider = createAiProvider(config.ai);
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
      requirePlan: config.agent.queryPlan,
      observer: new CliAgentObserver({
        verbose: mode === 'debug',
        style: errStyle,
        spinner,
      }),
      databaseContext,
      responseMode: mode,
    },
  );

  try {
    spinner.start('Thinking');
    const result = await agent.ask(question).finally(() => spinner.stop());

    if (result.incomplete) {
      console.error(`\n${errStyle.red('Error:')} ${result.text}`);
      process.exitCode = 1;
    } else {
      console.log('\n' + renderMarkdown(result.text, outStyle, terminalWidth(process.stdout)));
    }

    if (mode === 'debug') {
      const steps = `${result.steps} step${result.steps === 1 ? '' : 's'}`;
      const calls = `${result.toolCalls} tool call${result.toolCalls === 1 ? '' : 's'}`;
      const plan = result.plan;

      if (errStyle.rich) {
        const parts = [steps, calls];
        if (plan) {
          parts.push(
            `plan ${plan.accepted} accepted` +
              (plan.rejected ? `, ${plan.rejected} rejected` : '') +
              (plan.sqlMismatches ? `, ${plan.sqlMismatches} SQL mismatch${plan.sqlMismatches === 1 ? '' : 'es'}` : ''),
          );
        }
        const mark = result.incomplete ? errStyle.red('✗') : errStyle.green('✓');
        console.error(`\n${mark} ${errStyle.dim(parts.join(' · '))}`);
      } else {
        console.error(`\n[agent] ${steps}, ${calls}`);
        if (plan) {
          console.error(
            `[plan] ${plan.submitted} submitted, ${plan.accepted} accepted, ${plan.rejected} rejected, ${plan.sqlMismatches} SQL mismatches`,
          );
        }
      }
    }
  } finally {
    spinner.stop();
    await database.close?.();
  }
}

main().catch((error) => {
  console.error(`\n${createStyle(process.stderr).red('Error:')} ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
