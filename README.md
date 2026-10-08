# SQL AI Harness

Open-source, privacy-first AI integration layer for existing relational databases.

## M4: CLI agent

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

A template is included as `sql-ai.md.example`.


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
