# SQL AI Harness — Project Documentation

**Package:** `sql-ai-harness`  
**Current version:** `0.1.0`  
**Runtime:** Node.js 20+  
**Language:** TypeScript (ES modules)  
**License:** ISC

SQL AI Harness is an open-source integration layer that lets an AI model answer questions about an existing relational database. It discovers schema information, exposes database-inspection and query tools to an agent, executes permitted SQL, and formats the result for the user.

This document describes the current implementation. The project is under active development; treat it as a development-stage tool and validate it against your own database and workload before relying on it.

## Contents

- [Goals and scope](#goals-and-scope)
- [Current capabilities and limitations](#current-capabilities-and-limitations)
- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation and setup](#installation-and-setup)
- [Configuration reference](#configuration-reference)
- [Using the CLI](#using-the-cli)
- [Optional database context](#optional-database-context)
- [Using the TypeScript SDK](#using-the-typescript-sdk)
- [Safety and data handling](#safety-and-data-handling)
- [Schema caching and query attempts](#schema-caching-and-query-attempts)
- [Testing and evaluation](#testing-and-evaluation)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Roadmap considerations](#roadmap-considerations)

## Goals and scope

The project is intended to provide a reusable harness between an AI provider and an existing database, rather than require a new database schema or a model trained specifically for one application.

Design goals:

- Allow users to bring their own AI provider credentials.
- Query an existing MySQL/MariaDB database through a database adapter.
- Give the agent tools for schema discovery, relationship inspection, SQL execution, and query explanation.
- Apply query safety checks and execution/result limits.
- Offer a CLI and a public TypeScript SDK over shared agent functionality.
- Keep the provider integration separate from database access so those parts can evolve independently.

## Current capabilities and limitations

### Available in this release

- Interactive `init` command for configuring a database and AI provider.
- `ask` command with natural, technical, and debug response modes.
- AI provider integrations for OpenRouter, Google Gemini, Groq, Cerebras, and an Ollama-compatible endpoint.
- MySQL database adapter.
- Tools for listing tables, describing one or more tables, discovering foreign-key relationships, executing permitted queries, and explaining SQL.
- Schema metadata caching in process memory.
- Optional `sql-ai.md` business/domain context file.
- Automated tests and an evaluation runner under `evals/`.
- Public TypeScript package exports from `sql-ai-harness`.

### Not currently promised

- PostgreSQL, SQLite, or other database adapters in the CLI. The SDK defines a `DatabaseAdapter` integration point, but this release includes a MySQL adapter.
- A hosted service or HTTP API for remote clients.
- A PHP SDK or SDKs for languages other than TypeScript.
- Guaranteed correctness for arbitrary natural-language questions or schemas.
- Complete semantic validation that every generated join matches the business meaning of a question.
- Automatic AI provider/model credential validation during setup. The setup wizard tests the database connection, not an inference request to the provider.

## How it works

At a high level, a question passes through these stages:

1. **Load configuration.** Provider, model, database connection, and execution limits are read from environment variables and the `.env` file.
2. **Initialize integrations.** The CLI creates the selected AI provider and opens a MySQL connection.
3. **Load optional domain context.** If `sql-ai.md` exists in the current working directory, its contents are provided as additional business context.
4. **Discover schema and relationships.** The agent uses tools to inspect tables, table definitions, and foreign-key relationships. A successful global relationship-discovery call is required before SQL execution.
5. **Plan and execute.** The model can call database tools. SQL execution is guarded by the safety layer and configured limits.
6. **Review and respond.** The agent compares available results with the original question and returns a response in the requested mode.
7. **Close the database connection.** The CLI closes the adapter in a `finally` block.

The harness can reduce avoidable mistakes, but a successful SQL execution does not by itself prove that the query answers the intended business question. Validate important results independently.

## Requirements

- Node.js **20 or later**.
- `pnpm` for development from a source checkout (or npm when installing the published package).
- Access to a MySQL/MariaDB database and a database account with the minimum permissions required.
- Credentials and a model ID for one supported AI provider. For Ollama, an Ollama-compatible endpoint and a locally available model are required.

## Installation and setup

### Option A: Interactive setup

Run this command from the directory where you want the harness configuration stored:

```bash
npx sql-ai-harness init
```

The wizard asks for:

- MySQL/MariaDB host, port, database name, username, and password.
- AI provider and exact model ID.
- Provider API key for hosted providers, or base URL for Ollama.
- Agent step limit, SQL row limit, and schema-cache lifetime.

It attempts to connect to the database and list tables before saving settings to `.env`. It does not test the AI provider by sending an inference request.

If `.env` already exists, the wizard asks before updating harness settings and preserves unrelated entries. Use `--force` to skip that confirmation:

```bash
npx sql-ai-harness init --force
```

The wizard writes `.env` with restrictive file permissions where supported. Keep this file private and out of version control.

### Option B: Configure from a source checkout

Clone the repository and install dependencies:

```bash
git clone https://github.com/NegusDev/sql-ai-harness.git
cd sql-ai-harness
pnpm install
cp .env.example .env
```

Edit `.env` using the [configuration reference](#configuration-reference). Then run a question through the development CLI:

```bash
pnpm dev ask "List active users"
```

### Build and run the CLI

```bash
pnpm build
node dist/cli.js ask "List active users"
```

To create a package tarball locally:

```bash
npm pack
```

`npm pack --dry-run` only previews the package contents; it does not create a `.tgz` file.

Once the package is published to npm, it can be installed globally with:

```bash
npm install --global sql-ai-harness
sql-ai-harness init
sql-ai-harness ask "List active users"
```

## Configuration reference

The CLI loads settings from the process environment and `.env` in the current working directory. Environment variables supplied by the runtime take precedence according to normal dotenv behavior.

### AI provider

| Variable | Purpose | Example / default |
|---|---|---|
| `AI_PROVIDER` | Provider selection: `openrouter`, `google`, `groq`, `cerebras`, or `ollama` | `openrouter` in `.env.example` |
| `AI_MODEL` | Exact model identifier accepted by the selected provider | Must be set |
| `OPENROUTER_API_KEY` | OpenRouter credential | Empty in template |
| `GROQ_API_KEY` | Groq credential | Empty in template |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini credential | Empty in template |
| `CEREBRAS_API_KEY` | Cerebras credential | Empty in template |
| `OLLAMA_BASE_URL` | Ollama-compatible OpenAI API endpoint | `http://localhost:11434/v1` |
| `AI_SITE_URL` | Optional OpenRouter application URL metadata | Empty in template |
| `AI_SITE_NAME` | Optional OpenRouter application name metadata | `SQL AI Harness` in template |

Set the key corresponding to the selected hosted provider. For Ollama, configure the endpoint and ensure the model is available locally. Provider and model availability, pricing, quotas, and API behavior depend on the provider and can change independently of this project.

### Database connection

| Variable | Purpose | Example / default |
|---|---|---|
| `DB_DRIVER` | Database adapter identifier | `mysql` |
| `DB_HOST` | Database hostname or IP | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | Must be set |
| `DB_USER` | Database username | Use a restricted account |
| `DB_PASSWORD` | Database password | Set privately |

The current CLI supports MySQL. MariaDB can be used through the MySQL-compatible adapter, subject to compatibility with the schema and server configuration.

### Safety and runtime limits

| Variable | Purpose | Template value |
|---|---|---:|
| `SQL_MAX_ROWS` | Maximum rows returned by a query | `500` |
| `SQL_QUERY_TIMEOUT_MS` | Query timeout in milliseconds | `10000` |
| `SQL_MAX_RESULT_BYTES` | Maximum result payload size in bytes | `1048576` |
| `AGENT_MAX_STEPS` | Maximum agent loop steps | `8` |
| `SCHEMA_CACHE_TTL_MS` | Schema cache lifetime in milliseconds | `300000` (5 minutes) |

Use the values in `.env.example` as starting points, then tune and test them against your database. A higher row limit or timeout can increase resource use and the amount of data exposed to the model.

## Using the CLI

### Ask a question

```bash
sql-ai-harness ask "How many students are enrolled?"
```

From the source checkout, use `pnpm dev ask "How many students are enrolled?"` instead.

### Response modes

**Natural mode** is the default and gives a concise, business-friendly answer:

```bash
sql-ai-harness ask "How much revenue did we make last month?"
```

**Technical mode** includes useful SQL and technical details when relevant:

```bash
sql-ai-harness ask --mode technical "How much revenue did we make last month?"
```

**Debug mode** includes technical details and tool execution diagnostics:

```bash
sql-ai-harness ask --mode debug "How much revenue did we make last month?"
```

Shorthand flags are also available:

```bash
sql-ai-harness ask --technical "List active users"
sql-ai-harness ask --debug "List active users"
```

### Available agent tools

| Tool | Purpose |
|---|---|
| `list_tables` | List available database tables. |
| `describe_table` | Inspect the structure of a table. |
| `describe_tables` | Inspect multiple relevant tables in one call. |
| `get_relationships` | Discover foreign-key relationships across the database. |
| `execute_query` | Execute SQL permitted by the safety layer and configured limits. |
| `explain_query` | Request a database query plan/explanation where supported. |

## Optional database context

The harness can use a `sql-ai.md` file in the current working directory to provide business vocabulary and rules that may not be obvious from table and column names. This file is optional; it supplements rather than replaces schema discovery.

Example:

```md
# Database Context

## Overview

This database belongs to a school management system. It stores students,
parents, teachers, classes, enrollments, and payments.

## Business Rules

- Only active enrollments represent currently enrolled students.
- Completed payments are considered successful payments.
- Cancelled payments should not be included in revenue calculations.
```

Use only accurate, current rules. Incorrect context can lead to incorrect interpretations even when the generated SQL is syntactically valid. A starter template may be available in `sql-ai.example.md` in the repository.

## Using the TypeScript SDK

The package exports a public SDK from `sql-ai-harness`. Avoid importing from internal `src/` paths because those are not part of the package's public API.

```ts
import {
  Agent,
  MySqlAdapter,
  createAiProvider,
  loadConfig,
} from "sql-ai-harness";

const config = loadConfig();
const database = new MySqlAdapter({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

const provider = createAiProvider(config.ai);
const agent = new Agent(
  provider,
  { database, safety: config.safety },
  { maxSteps: config.agent.maxSteps, responseMode: "natural" },
);

try {
  const result = await agent.ask("List active users");
  console.log(result.text);
} finally {
  await database.close();
}
```

The public entry point also exports types and interfaces such as `DatabaseAdapter`, `ToolContext`, agent result/options types, provider interfaces, observer types, and `SchemaCache`. Check `src/index.ts` for the exact exports in the version you are using.

The SDK accepts a `DatabaseAdapter` abstraction, which provides an extension point for other database implementations. Only the MySQL adapter is included in this release. Applications implementing their own adapter should ensure its query execution behavior respects the harness safety contract.

## Safety and data handling

SQL AI Harness is designed to constrain database access, but it should not be treated as a complete security boundary by itself.

Recommended deployment practices:

1. **Use a dedicated read-only database account.** Grant only the access needed to inspect the required schema and read the required tables. Do not rely solely on the model or application validator to prevent writes.
2. **Limit the account's visibility.** Avoid granting access to unrelated databases, sensitive tables, or columns that the agent does not need.
3. **Keep credentials private.** Do not commit `.env`, publish it in logs, or include credentials in issue reports. Rotate any credential that is exposed.
4. **Review provider data handling.** Depending on the question and agent tool flow, schema metadata, question text, generated SQL, and query results may be sent to the selected AI provider. Check the provider's retention, training, residency, and contractual settings before using sensitive data.
5. **Set conservative limits.** Configure row limits, result-size limits, timeouts, and agent steps for the environment.
6. **Validate important answers.** Independently check queries and outputs used for financial, operational, compliance, or other consequential decisions.
7. **Test on a non-production database first.** Evaluate the harness with representative questions and a disposable or appropriately sanitized database snapshot.

The current agent requires successful global foreign-key discovery before executing SQL and limits SQL execution attempts per question. These measures help the model plan joins and avoid repeated attempts, but they do not guarantee that every join or aggregation is semantically correct. The relationship map is not a formal proof that each generated join follows a declared foreign key, and undeclared relationships may not be discoverable.

## Schema caching and query attempts

Schema metadata—table listings, table descriptions, and foreign-key relationships—is cached in memory for the configured `SCHEMA_CACHE_TTL_MS` duration. The default template value is five minutes. Query results are not cached.

The cache is process-local and is discarded when the process exits. In the current CLI, this primarily reduces repeated schema calls during a single agent run; a future long-lived interface may benefit more from it.

SQL execution attempts are capped at three per question in the current implementation. The agent can use those attempts to recover from an invalid or inadequate query, but should not be expected to retry indefinitely or solve every ambiguous question.

## Testing and evaluation

Run the project checks from the repository root:

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run
```

The `evals/` directory contains a benchmark dataset, runner, and saved reports. See [`evals/README.md`](evals/README.md) for dataset setup and scoring details.

Run a benchmark against a disposable evaluation database:

```bash
pnpm eval -- --tag local-check
```

When comparing changes, keep the provider/model, database snapshot, configuration, and benchmark dataset consistent. Review the generated reports for answer checks, result equivalence, safety events, tool activity, and latency. A passing benchmark only supports the cases tested; it is not a guarantee of general correctness.

## Troubleshooting

### Database connection fails during setup

- Confirm the host, port, database name, username, and password.
- Verify that the database accepts connections from the machine running the harness.
- Confirm the account has permission to inspect tables and read the required data.
- Check network rules, firewalls, and database allowlists.
- Run the wizard again after correcting the connection details.

### Provider authentication or model errors

- Confirm `AI_PROVIDER` matches the provider whose credential is configured.
- Check that `AI_MODEL` is the exact model ID expected by that provider.
- Confirm the key is active and has quota/permission for the model.
- For Ollama, confirm the endpoint is reachable and the model has been pulled/installed.
- The setup wizard does not make a provider inference request, so database setup can succeed even if provider configuration is invalid.

### The answer is incorrect or incomplete

- Try `--mode technical` or `--mode debug` to inspect the query path and tool activity.
- Check the relevant table definitions and foreign-key relationships.
- Review `sql-ai.md` for outdated or ambiguous business rules.
- Ask a narrower question with explicit date ranges, statuses, or definitions.
- Verify the generated SQL and results directly against the database.
- Add a representative case to the evaluation suite if it exposes a repeatable failure.

### The command cannot find configuration

- Run the command from the directory containing `.env`, or set the required environment variables in the process environment.
- Confirm `.env` uses the variable names in `.env.example`.
- Ensure the selected provider's key is present and `AI_MODEL` is set.

## Project structure

```text
src/
  ai/             Provider factory and provider interfaces
  commands/       CLI commands, including interactive init
  config/         Environment and .env configuration loading
  context/        Optional business/domain context loading
  core/agent/     Agent loop and observability interfaces
  core/tools/     Schema and SQL tools exposed to the agent
  database/       Database adapter interface and MySQL implementation
  safety/         SQL validation, policy checks, and execution limits
  schema/         In-memory schema metadata cache
  cli.ts          CLI entry point
  index.ts        Public TypeScript SDK exports
evals/            Benchmark dataset, runner, and reports
tests/            Automated tests
```

## Roadmap considerations

The architecture provides extension points for additional database adapters and interfaces. An HTTP/JSON API could later allow PHP and other language clients to use the same core agent, with language-specific SDKs wrapping that API. These are possible future directions, not capabilities included in the current release.

For current commands, exports, and configuration, use the code and `.env.example` from the exact version you have installed as the source of truth.
