# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [Semantic Versioning](https://semver.org) (0.x: minor versions may change behavior).

## [Unreleased]

### Changed
- **Renamed from `sql-ai-harness` to `dbask`.** The npm package is now `@negusdev/dbask` (the unscoped name `dbask` was blocked by npm's name-similarity check) and the command is `dbask`. The `sql-ai-harness` command stays as an alias for now. You can now ask without the subcommand: `dbask "who owes us money?"` (`dbask ask "…"` still works). Mistyped options and one-word mistyped commands now print an error instead of being sent to the model, and `dbask --version` and `--help` were added. Environment variables, the `sql-ai.md` context file and the SDK API are unchanged; update imports from `"sql-ai-harness"` to `"dbask"`. The structured debug events now use `source: "dbask"`.

## [0.1.8] - 2026-11-13

### Added
- **DeepSeek provider.** Set `AI_PROVIDER=deepseek` and `DEEPSEEK_API_KEY`.
- **Optional query plan** (`AGENT_QUERY_PLAN=on`, or `requirePlan: true` in the SDK). The agent submits a structured plan (tables, columns, joins, filters) that is checked against your real schema before any SQL runs; the SQL may then read only the planned tables. Unknown tables or columns and unconnected tables are rejected, joins that are not declared foreign keys produce warnings, and plan submissions are capped at 4. `AgentResult.plan` reports submitted, accepted, rejected and SQL-mismatch counts. New exports: `StructuredQueryPlan`, `PlanStats`.
- **Terminal UI.** Progress spinner with the current step, Markdown answers rendered for the terminal (aligned tables that wrap instead of cutting ids, bold, code, lists), highlighted SQL, and a clearer `--mode debug` trace that shows the plan, plan warnings and plan counts. `validate` uses symbols and color. Piped or redirected output is unchanged; `NO_COLOR` and `FORCE_COLOR` are honored.
- `CONTRIBUTING.md`.

### Changed
- **The query plan is off by default.** On the 40-case benchmark it added about 0.7 tool calls and roughly 30% median latency per question without improving accuracy. Turn it on with `AGENT_QUERY_PLAN=on` if you want the agent's assumptions visible. (SDK: `new Agent(..., { requirePlan: true })`; the SDK default is also off.)
- **The agent stays on topic.** It now declines questions that are not about the connected database (arithmetic, general knowledge, writing, instruction overrides) without calling tools or querying, and treats text found in table names, column names or row values as data, not instructions.
- **The agent always ends with an answer.** The last step is reserved for the final answer, and a run that cannot finish returns `AgentResult.incomplete`; the CLI prints it as an error and exits with code 1. Write requests are refused up front.
- Updated the Vercel AI SDK packages.

### Development
- Evaluation: 40-case dataset (adds four off-topic cases), value-based result comparison, tolerant answer checks, refusal scoring, provider-error retries excluded from scores, `--repeat N` with a cross-run summary, `--only`, process-group timeout kill, and run settings (model, commit, max steps, plan flag) in report headers.
- Benchmark result for this release: 39 of 40 cases passed in every one of three runs (`gemini-3.5-flash-lite`, synthetic database). The one consistent failure is a known reference-answer error, not an agent error. See the README for caveats.

### Upgrade notes
- No action needed for the CLI. If you script `submit_query_plan` directly, the plan shape changed: `fields` is a list of `{table, column}` and `joins` a list of `{left, right}`.

## [0.1.7] - 2026-11-05

### Added
- PostgreSQL support (tables, partitioned tables and schemas; views are not listed yet).
- `validate` command to check configuration, database connection, foreign keys, AI provider and `sql-ai.md`.

For earlier releases, see the [commit history](https://github.com/NegusDev/sql-ai-harness/commits/main) and the npm release list.

[0.1.8]: https://github.com/NegusDev/sql-ai-harness/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/NegusDev/sql-ai-harness/releases/tag/v0.1.7
