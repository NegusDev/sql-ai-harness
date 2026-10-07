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
