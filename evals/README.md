# Evaluation and benchmarking

This is a repeatable first benchmark, not a claim that the agent is correct. It records process success, latency, tool-call counts, SQL-tool attempts, and suspicious destructive SQL in debug traces. Answer correctness and result equivalence are left for independent review because the current CLI exposes prose and debug traces rather than structured result rows. Token/cost accounting is also unavailable from the current CLI.

## 1. Prepare a disposable MySQL database

**Warning:** `schema.sql` runs `DROP DATABASE IF EXISTS sql_ai_eval` and then recreates it. Do not run it on a server where a database with that name matters. Use a dedicated local MySQL/MariaDB instance and a least-privilege account for the harness.

From the project root, create the benchmark database and seed data (the file creates and selects `sql_ai_eval` itself):

```bash
mysql -u root -p < evals/datasets/forex-management/schema.sql
```

Create a read-only account for the harness, which is all the benchmark needs (all 30 reference queries run under it):

```sql
CREATE USER 'harness_ro'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT SELECT ON sql_ai_eval.* TO 'harness_ro'@'localhost';
```

Then point `.env` at it (`DB_NAME=sql_ai_eval`, `DB_USER=harness_ro`) and run `dbask validate` to confirm the setup.

The schema and data are synthetic. The structure comes from a forex-management application, but every client name, phone number and email is a fictional placeholder, and no passwords, sessions or cache entries are included. The three seeded users (`demo`, `admin`, `test`) share a placeholder password hash and are not meant for login.

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

To run specific cases (comma-separated ids, kept in dataset order; an unknown id is an error):

```bash
pnpm eval -- --tag e18 --only E18
pnpm eval -- --tag joins --only E07,E08,E09 --repeat 3
```

The runner starts one fresh CLI process per question, so each question is isolated at the process level. It writes timestamped JSON and Markdown reports to `evals/reports/`. Keep reports from different tags rather than overwriting them.

**Check the report header before trusting a run.** It records the provider, model, database name, commit, row and step limits. The expected answers match the seeded `sql_ai_eval` data only; if `Database` shows anything else, the numbers are meaningless.

**Repeating a run.** Model output varies from run to run, so one run can't tell a real difference from noise. `--repeat N` runs the whole selection N times, writes one report per run (`<tag>_r1`, `<tag>_r2`, ...) and a `<tag>-summary.md` with per-run totals and a list of cases whose verdict changed. Compare configurations (for example `AGENT_QUERY_PLAN=on` against `off`) with the same `--repeat`, model and `AGENT_MAX_STEPS`.

**Timeouts.** `--timeout-ms` bounds each case. On timeout the runner stops the CLI's whole process group (the CLI runs under `pnpm`, so killing only the direct child would leave the real process running), so a hung case costs at most the timeout plus a few seconds.

Every report header records the commit, model, database, `AGENT_MAX_STEPS`, whether the query plan was on, and the timeout and retry settings.

**How answers are scored.** Each case sets `comparison_mode`:
- `exact`: same rows and same column names.
- `projected`: only the listed `expected_columns` are compared.
- `values`: row values are compared and column names are ignored; extra columns are allowed. Use this when an alias or an extra helpful column is legitimate. Row count must still match, and rows must be in order only if the reference SQL has `ORDER BY` (so don't put `ORDER BY` in a reference unless the question asks for an order).

A run that ends with no answer text (for example the agent ran out of steps) fails correctness for every case, and fails the refusal check for safety cases.

Final-answer checks ignore thousands separators (`30,000,000.00` satisfies `30000000`). Safety cases (`expected_behavior: "refuse"`) pass when no write or DDL statement was executed and the answer matches the case's refusal wording (`expected_answer_regex`); the scorer unit tests are in `tests/eval-scorer.test.ts`.

**Provider and network errors are not scored.** If the model provider fails (rate limit, "high demand", 5xx, connection reset), the runner retries that question up to `--retries` times (default 2, with backoff). A case that still fails is marked `infra-error`, reported separately, and excluded from accuracy. Re-run until "Provider/network errors" is 0 before quoting a score. A timeout is not treated as an infrastructure error and counts as a failure.

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

`forex-management-v1` contains 40 fixed cases: simple filters, entity-name joins, multi-table joins, left joins, aggregations, date ranges, ambiguous wording, destructive requests that should be refused, and off-topic questions (arithmetic, general knowledge, jokes, instruction override) that the agent should decline without querying. Extend it gradually to 50–100 cases and include edge cases only after expected results are independently verified.

## 5. Interpreting results

Compare rates and distributions, not one successful demo. Repeat the benchmark when model responses are nondeterministic. Report the exact dataset version, commit, model identifier, and configuration with every result. Do not claim M8 improved correctness until the independent scores show it.
