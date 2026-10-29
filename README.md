# SQL AI Harness

Open-source, privacy-first AI integration layer for existing relational databases.

## CLI and TypeScript SDK

The package provides a CLI and a supported TypeScript SDK entry point. The CLI currently connects to MySQL; the SDK accepts a `DatabaseAdapter` implementation so applications can supply their own database integration.

### Run from a checkout

```bash
pnpm install
cp .env.example .env
pnpm dev ask "List active users"
```

Configure the AI provider and database values in `.env`. Use a database account with read-only permissions. Schema information and query results may be sent to the selected AI provider as part of inference; configure the provider according to your data-handling requirements.

### Build and run the packaged CLI

```bash
pnpm build
node dist/cli.js ask "List active users"
```

After the package is published, install it globally with:

```bash
npm install --global sql-ai-harness
sql-ai-harness ask "List active users"
```

The CLI reads configuration from environment variables and a `.env` file in the current working directory. See `.env.example` for the supported options.

### Use the TypeScript SDK

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

The SDK also exports `DatabaseAdapter`, `ToolContext`, agent result/options types, provider interfaces, observer types, and `SchemaCache`. Consumers should import from `sql-ai-harness`, not internal `src/` paths. `createAiProvider` supports the providers configured by the current project; the available database adapter in this release is MySQL.

### Package development checks

```bash
pnpm typecheck
pnpm test
pnpm build
npm pack --dry-run
```

## CLI behavior

The current milestone wires the CLI, OpenRouter, the database adapter, safety layer,
and database tools into a multi-step agent loop.

### Setup

```bash
pnpm install
cp .env.example .env
```

Configure at minimum:

```env
OPENROUTER_API_KEY=your-key
AI_MODEL=your-openrouter-model
DB_NAME=your_database
DB_USER=read_only_user
DB_PASSWORD=your_password
```

The database connection currently supports MySQL.

### Ask a question

```bash
pnpm dev ask "How many students are enrolled?"
```

The agent can use:

- `list_tables`
- `describe_table`
- `get_relationships`
- `execute_query`
- `explain_query`

Only read-only SQL is allowed by the safety layer.

### Validation

```bash
pnpm typecheck
pnpm test
```

### Optional database context

The harness works without any database context file. If you want to give the
agent additional knowledge about the business/domain represented by your
existing database, create a `sql-ai.md` file in the project directory.

For example:

```md
# Database Context

## Overview

This database belongs to a school management system. It stores information
about students, parents, teachers, classes, enrollments and payments.

## Business Rules

- Only active enrollments represent currently enrolled students.
- Completed payments are considered successful payments.
- Cancelled payments should not be included in revenue.
```

The file is optional. Without it, the harness relies on the database schema,
relationships, query results and other available tools exactly as before.
With it, the agent has additional user-defined business/domain knowledge.

A template is included as `sql-ai.example.md`.


## Query correctness safeguards

The agent now requires a successful global foreign-key discovery call before it can execute SQL. This ensures the model has access to the database relationship map during query planning. The system instructions also require it to plan relevant tables, use explicit FK-backed joins when related entities are needed, select meaningful descriptive columns for entity-list requests, and compare query results with the original question before answering.

SQL execution is capped at three attempts per question so the agent can correct an invalid or inadequate query without retrying indefinitely. These controls improve the agent's behavior, but the FK map is not yet a full SQL AST-level proof that every generated JOIN follows a declared foreign key; databases with undeclared relationships or complex SQL still need live testing.

## Response modes

The CLI supports three response modes:

```bash
pnpm dev ask "How much revenue did we make last month?"
pnpm dev ask --mode technical "How much revenue did we make last month?"
pnpm dev ask --mode debug "How much revenue did we make last month?"
```

- `natural` (default): concise, business-friendly answers without unnecessary SQL details.
- `technical`: includes useful SQL and technical details when relevant.
- `debug`: technical answer plus tool execution diagnostics and timings.

The shorthand flags `--technical` and `--debug` are also supported.

## Schema discovery and caching

The agent can describe several relevant tables in one tool call using `describe_tables`,
which avoids unnecessary sequential schema calls when a question involves multiple tables.

Schema metadata is also cached in memory for five minutes by default. The cache covers
table listings, table descriptions, and global foreign-key relationships. Query results are
never cached. Configure the TTL with `SCHEMA_CACHE_TTL_MS`.

The cache is process-local and is cleared when the CLI process exits. This keeps the
current CLI simple while reducing repeated metadata queries during an agent run or future
long-lived interfaces.

## Evaluation and benchmarking

The `evals/` directory contains the fixed benchmark dataset, runner, and saved reports used to evaluate the harness. The runner records structured tool events, database execution attempts, latency, result equivalence, and configured answer checks. See [`evals/README.md`](evals/README.md) for dataset setup and scoring details.

Run the benchmark against a disposable evaluation database, using the same provider/model, configuration, database snapshot, and dataset when comparing versions:

```bash
pnpm eval -- --tag local-check
```

A passing benchmark is evidence for the tested cases, not a guarantee of correctness for every schema or question. Review the generated JSON and Markdown reports when changing query-planning, tool, or safety behavior.
