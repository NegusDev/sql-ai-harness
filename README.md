# SQL AI Harness

**Open-source, privacy-first, self-hostable Text-to-SQL for your existing relational database.**

Ask questions in plain language about a MySQL or MariaDB database you already have. SQL AI Harness discovers the schema, gives an AI agent tools to inspect and query it, enforces execution limits, and returns an answer. No new schema, no model trained for your app, no hosted service.

Bring your own model. Run it yourself.

[![npm](https://img.shields.io/npm/v/sql-ai-harness.svg)](https://www.npmjs.com/package/sql-ai-harness)
[![node](https://img.shields.io/node/v/sql-ai-harness.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/sql-ai-harness.svg)](./LICENSE)

> **Development status:** SQL AI Harness is under active development (`0.1.0`). Validate it against your own schema and workload before relying on it, especially for consequential decisions.

## Contents

- [Why SQL AI Harness](#why-sql-ai-harness)
- [Features](#features)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Data handling](#data-handling)
- [Usage](#usage)
- [Configuration](#configuration)
- [Optional database context](#optional-database-context)
- [TypeScript SDK](#typescript-sdk)
- [Database tools](#database-tools)
- [Safety and data handling](#safety-and-data-handling)
- [Database support](#database-support)
- [Evaluation](#evaluation)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Why SQL AI Harness

Most Text-to-SQL tools are either a hosted service that sees your schema and data, or tightly coupled to one model and one vendor. SQL AI Harness is a harness you run yourself, against a database you already own, with a model you choose.

It is a reusable layer between an AI provider and an existing relational database. It is not a new application with its own schema.

## Features

- **Natural-language questions** through the CLI or the TypeScript SDK.
- **Bring your own model:** OpenRouter, Google Gemini, Groq, Cerebras, or Ollama.
- **Schema-aware agent** with tools for listing tables, describing tables, discovering foreign keys, running queries, and `EXPLAIN`.
- **Safety by default:** configurable row, byte, timeout, and agent-step limits; capped SQL attempts; foreign-key discovery required before any SQL runs.
- **Optional `sql-ai.md`** for business rules and vocabulary the model cannot infer from the schema.
- **Three response modes:** natural, technical, and debug.
- **In-process schema cache** so repeated lookups in a run don't hit the database twice.
- **Benchmark suite** in `evals/` for reproducible evaluation of changes.

## Requirements

- **Node.js 20 or later**
- A **MySQL or MariaDB** database, and an account with read access to the tables the agent should see
- Credentials and a model ID for one supported AI provider (or a reachable Ollama endpoint)

> PostgreSQL, SQLite, a hosted HTTP API, and SDKs for languages other than TypeScript are **not** part of this release. The SDK defines a `DatabaseAdapter` interface as the extension point; only the MySQL adapter ships today.

## Quickstart

### 1. Configure

Run the setup wizard in the directory where you want the configuration stored:

```bash
npx sql-ai-harness init
```

The wizard asks for:

- MySQL/MariaDB host, port, database, username, and password
- AI provider and exact model ID
- An API key (hosted providers) or a base URL (Ollama)
- Agent step limit, SQL row limit, and schema-cache lifetime

It tests the **database connection** and lists tables before saving. It does **not** send an inference request, so a successful `init` does not prove the provider key or model ID is correct.

If `.env` already exists, the wizard asks before updating harness settings and preserves unrelated entries. Skip the confirmation with `--force`:

```bash
npx sql-ai-harness init --force
```

Keep `.env` private and out of version control. The wizard writes it with restrictive permissions where supported.

### 2. Ask a question

```bash
npx sql-ai-harness ask "How many students are enrolled?"
```

### 3. Install globally (optional)

```bash
npm install --global sql-ai-harness
sql-ai-harness ask "List active users"
```

## Data handling

SQL AI Harness itself does not phone home. No telemetry, no crash reporting, no license check on startup, no cloud dependency. The harness runs on your machine (or your own server) and talks to your database directly.

What does leave your machine is what your chosen AI provider receives. Depending on the question and tool flow, that can include schema metadata, question text, generated SQL, and query results. Review that provider's retention, training, and residency terms before using sensitive data.

If you need local-only inference, [Ollama-compatible endpoints are supported](#ai-provider), but this path is not currently exercised in the benchmark, so validate it against your own workload first.

To reduce exposure, see [Safety and data handling](#safety-and-data-handling): read-only database accounts, row/byte/timeout limits, and a required foreign-key discovery step before any SQL runs.

## Usage

```bash
sql-ai-harness ask "How much revenue last month?"                      # natural (default)
sql-ai-harness ask --mode technical "How much revenue last month?"     # answer + SQL
sql-ai-harness ask --mode debug "How much revenue last month?"         # answer + tool traces
```

Shorthand flags `--technical` and `--debug` also work.

| Mode | Output |
|---|---|
| `natural` | A concise, business-friendly answer. |
| `technical` | The answer plus the SQL that was run. |
| `debug` | The answer plus tool-call diagnostics. Start here when an answer looks wrong. |

## Configuration

Configuration is loaded from `.env` in the current working directory plus the process environment. See `.env.example` in the repository for a full template.

### AI provider

| Variable | Purpose | Example |
|---|---|---|
| `AI_PROVIDER` | One of `openrouter`, `google`, `groq`, `cerebras`, `ollama` | `openrouter` |
| `AI_MODEL` | Exact model ID accepted by the provider | *required* |
| `OPENROUTER_API_KEY` | OpenRouter credential | n/a |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini credential | n/a |
| `GROQ_API_KEY` | Groq credential | n/a |
| `CEREBRAS_API_KEY` | Cerebras credential | n/a |
| `OLLAMA_BASE_URL` | Ollama endpoint | `http://localhost:11434/v1` |
| `AI_SITE_URL` | Optional OpenRouter app URL metadata | n/a |
| `AI_SITE_NAME` | Optional OpenRouter app name metadata | `SQL AI Harness` |

Model availability, pricing, quotas, and API behavior are controlled by each provider and can change independently of this project.

### Database

| Variable | Purpose | Default |
|---|---|---|
| `DB_DRIVER` | Adapter identifier | `mysql` |
| `DB_HOST` | Hostname or IP | `127.0.0.1` |
| `DB_PORT` | Port | `3306` |
| `DB_NAME` | Database name | *required* |
| `DB_USER` | Username (**use a restricted read-only account**) | *required* |
| `DB_PASSWORD` | Password (set privately) | *required* |

### Limits

| Variable | Purpose | Default |
|---|---|---|
| `SQL_MAX_ROWS` | Max rows returned per query | `500` |
| `SQL_QUERY_TIMEOUT_MS` | Per-query timeout (ms) | `10000` |
| `SQL_MAX_RESULT_BYTES` | Max result payload size (bytes) | `1048576` |
| `AGENT_MAX_STEPS` | Max agent loop steps | `8` |
| `SCHEMA_CACHE_TTL_MS` | Schema cache lifetime (ms) | `300000` (5 min) |

Start from the `.env.example` values and tune against your own database. Higher limits increase both resource use and the amount of data exposed to the model.

## Optional database context

Place a `sql-ai.md` file in the working directory to explain business terms and rules that aren't obvious from table and column names. It supplements schema discovery; it does not replace it.

```markdown
# Database Context

## Overview

This database belongs to a school management system. It stores students,
parents, teachers, classes, enrollments, and payments.

## Business Rules

- Only active enrollments represent currently enrolled students.
- Completed payments are considered successful payments.
- Cancelled payments should not be included in revenue calculations.
```

Keep the rules accurate and current. Incorrect or ambiguous context can produce confidently wrong answers even when the generated SQL is valid. A starter template ships as [`sql-ai.example.md`](./sql-ai.example.md).

## TypeScript SDK

The package exports its public SDK from `sql-ai-harness`. Import from the package entry point; internal `src/` paths are not part of the public API.

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

The entry point also exports types and interfaces for the agent, providers, database adapters, tool context, observers, and `SchemaCache`. See `src/index.ts` in the installed version for the exact API surface.

The SDK accepts any `DatabaseAdapter` implementation. Custom adapters must preserve the harness safety expectations: read-only intent, row/byte/timeout limits, and bounded SQL attempts per question.

## Database tools

| Tool | Purpose |
|---|---|
| `list_tables` | List available database tables. |
| `describe_table` | Inspect one table's structure. |
| `describe_tables` | Inspect multiple tables in one call. |
| `get_relationships` | Discover foreign-key relationships across the database. |
| `execute_query` | Execute SQL allowed by the safety layer and configured limits. |
| `explain_query` | Request a query plan where supported. |

The agent requires **successful global foreign-key discovery before executing SQL**. This helps the model plan joins, but it does not prove every join or aggregation matches the business meaning of a question, and undeclared relationships may not be discoverable.

## Safety and data handling

SQL AI Harness applies safeguards and execution limits, but **it is not a complete security boundary by itself**. Recommended practices:

1. **Use a dedicated read-only database account** with only the schema-inspection and read permissions required. Don't rely solely on the model or the application validator to prevent writes.
2. **Restrict database visibility.** Avoid granting access to unrelated databases, sensitive tables, or columns.
3. **Protect credentials.** Don't commit `.env` or share credentials in logs or issue reports. Rotate any credential that is exposed.
4. **Review your AI provider's data handling.** Schema metadata, question text, generated SQL, and query results may be sent to the provider. Check its retention, training, residency, and contractual terms before using sensitive data.
5. **Set conservative limits** for rows, result size, timeout, and agent steps.
6. **Verify important answers** independently before using them for financial, operational, or compliance decisions.
7. **Test on a non-production database first**, such as a disposable or sanitized snapshot.

Successful SQL execution does not guarantee a correct answer. SQL attempts are capped per question, but correctness cannot be guaranteed for arbitrary questions or business-specific joins.

## Database support

| Database | Status |
|---|---|
| MySQL / MariaDB | Available |
| PostgreSQL | Planned (the `DatabaseAdapter` extension point is in place) |
| SQLite | Planned |
| Others | Implement `DatabaseAdapter` |

## Evaluation

The `evals/` directory contains a benchmark dataset, runner, and saved reports. Use it to check whether a change to the model, prompt, tool, or adapter measurably affects correctness.

```bash
pnpm eval -- --tag local-check
```

See [`evals/README.md`](./evals/README.md) for dataset setup and scoring. When comparing runs, keep the provider, model, database snapshot, configuration, and dataset consistent. A passing benchmark supports the cases tested; it is not a guarantee of general correctness.

## Development

```bash
git clone https://github.com/NegusDev/sql-ai-harness.git
cd sql-ai-harness
pnpm install
cp .env.example .env
```

Run a question through the development CLI:

```bash
pnpm dev ask "List active users"
```

Run the checks before submitting changes:

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run
```

Run the built CLI directly:

```bash
node dist/cli.js ask "List active users"
```

### Project layout

```text
src/
  ai/             Provider factory and provider interfaces
  commands/       CLI commands, including the init wizard
  config/         Environment and .env loading
  context/        Optional business context loading (sql-ai.md)
  core/agent/     Agent loop and observability interfaces
  core/tools/     Schema and SQL tools exposed to the agent
  database/       Database adapter interface and MySQL implementation
  safety/         SQL validation, policy checks, execution limits
  schema/         In-memory schema metadata cache
  cli.ts          CLI entry point
  index.ts        Public TypeScript SDK exports
evals/            Benchmark dataset, runner, and reports
tests/            Automated tests
```

## Troubleshooting

### Database connection fails

- Verify host, port, database name, username, and password.
- Confirm the database accepts connections from the machine running the harness.
- Confirm the account can inspect tables and read the required data.
- Check firewall rules and database allowlists.

### Provider authentication or model errors

- Confirm `AI_PROVIDER` matches the provider whose key you configured.
- Verify `AI_MODEL` is the exact model ID the provider expects.
- Check that the API key is active and has quota and access to the model.
- For Ollama, verify the endpoint is reachable and the model is installed.
- Remember that `init` tests the database, not the AI provider.

### The answer is incorrect or incomplete

- Run with `--mode technical` or `--mode debug` to inspect the SQL and tool activity.
- Inspect the relevant table definitions and foreign keys.
- Review `sql-ai.md` for outdated or ambiguous rules.
- Narrow the question with dates, statuses, or business definitions.
- Verify the generated SQL and results directly against the database.
- Add a representative case to `evals/` if the failure is repeatable.

### Configuration is not found

- Run the command from the directory containing `.env`, or set the variables in the process environment.
- Confirm variable names match `.env.example`.
- Check that `AI_MODEL` and the selected provider's credentials are set.

## Contributing

Issues and pull requests are welcome at [github.com/NegusDev/sql-ai-harness](https://github.com/NegusDev/sql-ai-harness).

Before opening a PR, run the project checks and confirm that changes to the agent, tools, or prompts don't regress the benchmark:

```bash
pnpm eval -- --tag <your-branch>
```

For bugs involving incorrect answers, include:

- The question you asked (or a close paraphrase)
- The `--mode debug` output
- The relevant table definitions and `sql-ai.md` content, if any
- The provider and model used

Do **not** include `.env` contents, credentials, or unfiltered production data in issue reports.

## License

Released under the [ISC License](./LICENSE).

## Links

- [Source](https://github.com/NegusDev/sql-ai-harness)
- [npm](https://www.npmjs.com/package/sql-ai-harness)
- [Issues](https://github.com/NegusDev/sql-ai-harness/issues)
- [Evaluation guide](./evals/README.md)
- [Business context template](./sql-ai.example.md)
