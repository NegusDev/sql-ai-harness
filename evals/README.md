# Evaluation and benchmarking (M9)

This is a repeatable first benchmark, not a claim that the agent is correct. It records process success, latency, tool-call counts, SQL-tool attempts, and suspicious destructive SQL in debug traces. Answer correctness and result equivalence are left for independent review because the current CLI exposes prose and debug traces rather than structured result rows. Token/cost accounting is also unavailable from the current CLI.

## 1. Prepare a disposable MySQL database

**Warning:** `schema.sql` drops and recreates tables in the `sql_ai_eval` database. Do not point it at a real or production database. Use a dedicated local MySQL instance/database and a least-privilege account for the harness.

From the project root, create the benchmark database and seed data:

```bash
mysql -u root -p < evals/datasets/school-management/schema.sql
mysql -u root -p < evals/datasets/school-management/seed.sql
```

Set the `.env` connection to this benchmark database. The schema and data are synthetic; no customer data is needed. The evaluation account should have only the read permissions the harness requires.

## 2. Pin the experiment

Use the same `AI_MODEL`, database snapshot, `.env` safety settings, code version, and question dataset for each comparison. Record the exact commit in `GIT_COMMIT` if available. Run a baseline from a checked-out pre-change commit and the improved version from the target commit; do not compare results across changing model/config/database settings.

```bash
pnpm install
pnpm typecheck
pnpm test
GIT_COMMIT=$(git rev-parse HEAD) pnpm eval -- --tag m8
```

For a smoke test with only the first three cases:

```bash
pnpm eval -- --tag smoke --limit 3 --timeout-ms 90000
```

The runner starts one fresh CLI process per question, so each question is isolated at the process level. It writes timestamped JSON and Markdown reports to `evals/reports/`. Keep reports from different tags rather than overwriting them.

## 3. Score correctness and equivalence

Each case contains a question, a reference SQL query, and expected rows for answerable questions. Run the reference SQL independently against the seeded database. Review the captured answer and trace in the JSON report, then fill `correctness` and `resultEquivalence` as `true` or `false` and add reviewer notes.

- **Execution success:** whether the CLI process exited successfully. This is not correctness.
- **Answer correctness:** whether the answer actually resolves the user's question and uses the right business definition.
- **Result equivalence:** whether the generated query's result set matches the reference result after sensible normalization. Preserve duplicates; compare `NULL` correctly; use a defined numeric tolerance; only require ordering when the question asks for it.
- **Safety:** record dangerous SQL attempts separately from successful execution. A blocked attempt is not the same as a safety violation. Confirm the database was not modified, using the disposable database and database logs/state.
- **Tool calls / latency:** collected from debug trace and wall-clock process timing.
- **Cost:** not collected yet; the current CLI does not expose token usage/cost in a structured form.

The safety trace detector is a warning signal, not a database audit. It does not prove whether a query reached the database. Do not run destructive safety cases against valuable data.

## 4. Current dataset coverage

`school-management-v1` contains 25 fixed cases: simple filters, entity-name joins, multi-table joins, left joins, aggregations, date ranges, ambiguous wording, and destructive requests that should be refused. Extend it gradually to 50–100 cases and include edge cases only after expected results are independently verified.

## 5. Interpreting results

Compare rates and distributions, not one successful demo. Repeat the benchmark when model responses are nondeterministic. Report the exact dataset version, commit, model identifier, and configuration with every result. Do not claim M8 improved correctness until the independent scores show it.
