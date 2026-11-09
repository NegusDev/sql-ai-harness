import type { ToolSet } from 'ai';
import { describe, expect, it } from 'vitest';
import { Agent } from '../src/core/agent/agent.js';
import type { AgentObserver, AgentToolEvent } from '../src/core/agent/observability.js';
import type { AiProvider } from '../src/ai/provider.js';
import type {
  ModelRequest,
  ModelResponse,
  RelationshipInfo,
  ToolContext,
} from '../src/core/types/index.js';

// ---------------------------------------------------------------------------
// Harness: a provider that captures the tool set the agent builds, so tests can
// call the tools directly the way the model would.
// ---------------------------------------------------------------------------

type Tools = Record<string, { execute: (input: unknown, options: unknown) => Promise<any> }>;

class CapturingProvider implements AiProvider {
  readonly name = 'capture';
  tools!: Tools;
  system = '';

  async generate(request: ModelRequest & { tools?: ToolSet }): Promise<ModelResponse> {
    this.tools = request.tools as unknown as Tools;
    this.system = request.system ?? '';
    return { text: 'done', steps: 1, toolCalls: 0 };
  }
}

class Recorder implements AgentObserver {
  events: AgentToolEvent[] = [];
  onToolEvent(event: AgentToolEvent): void {
    this.events.push(event);
  }
  ends(name: string) {
    return this.events.filter((e) => e.type === 'tool-end' && e.name === name);
  }
}

function makeContext(overrides: { relationships?: () => Promise<RelationshipInfo[]> } = {}) {
  const executed: string[] = [];
  const context: ToolContext = {
    database: {
      dialect: 'mysql',
      async listTables() { return [{ name: 'clients' }, { name: 'transactions' }]; },
      async describeTable(table: string) {
        return { table: { name: table }, columns: [] };
      },
      getRelationships: overrides.relationships ?? (async () => []),
      async executeQuery(sql: string) {
        executed.push(sql);
        return { rows: [{ n: 1 }], rowCount: 1, executionTimeMs: 1 };
      },
      async explainQuery(sql: string) { return { sql, plan: [] }; },
    },
    safety: { readOnly: true, maxRows: 500, queryTimeoutMs: 10_000, maxResultBytes: 1_048_576 },
  };
  return { context, executed };
}

async function setup(overrides: Parameters<typeof makeContext>[0] = {}) {
  const provider = new CapturingProvider();
  const recorder = new Recorder();
  const { context, executed } = makeContext(overrides);
  await new Agent(provider, context, { observer: recorder }).ask('How many clients are there?');

  const call = (name: string, input: unknown) =>
    provider.tools[name]!.execute(input, { toolCallId: 't', messages: [] });

  return { provider, recorder, executed, call };
}

const plan = (overrides: Record<string, unknown> = {}) => ({
  objective: 'Count clients',
  tables: ['clients'],
  requiredFields: ['count(*)'],
  filters: [],
  joins: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Gate: execute_query requires an accepted plan
// ---------------------------------------------------------------------------

describe('query plan gate', () => {
  it('exposes submit_query_plan alongside the database tools', async () => {
    const { provider } = await setup();
    expect(Object.keys(provider.tools)).toEqual(
      expect.arrayContaining(['submit_query_plan', 'execute_query', 'describe_tables']),
    );
  });

  it('rejects execute_query before any plan is submitted, without touching the database', async () => {
    const { call, executed, recorder } = await setup();

    const result = await call('execute_query', { sql: 'SELECT COUNT(*) FROM clients' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/submit_query_plan/);
    expect(executed).toEqual([]);

    const end = recorder.ends('execute_query')[0] as any;
    expect(end.success).toBe(false);
    expect(end.databaseExecutionAttempted).toBe(false);
  });

  it('allows execute_query after a plan is accepted', async () => {
    const { call, executed } = await setup();

    const accepted = await call('submit_query_plan', plan());
    expect(accepted.success).toBe(true);
    expect(accepted.data).toMatchObject({ accepted: true, submission: 1 });

    const result = await call('execute_query', { sql: 'SELECT COUNT(*) AS n FROM clients' });
    expect(result.success).toBe(true);
    expect(executed).toEqual(['SELECT COUNT(*) AS n FROM clients']);
  });

  it('does not let a failed plan unlock execution', async () => {
    const { call, executed } = await setup();

    // execute() is called directly here, so the schema is exercised via the
    // tool's own safeParse path: a plan with no tables must not be stored.
    const rejected = await call('submit_query_plan', plan({ tables: [] }));
    expect(rejected.success).toBe(false);

    const result = await call('execute_query', { sql: 'SELECT 1' });
    expect(result.success).toBe(false);
    expect(executed).toEqual([]);
  });

  it('keeps the latest accepted plan active and counts submissions', async () => {
    const { call } = await setup();

    await call('submit_query_plan', plan({ objective: 'first' }));
    const second = await call('submit_query_plan', plan({ objective: 'second', tables: ['transactions'] }));

    expect(second.data.submission).toBe(2);
    expect(second.data.plan.objective).toBe('second');
  });

  it('keeps plan state separate between ask() calls', async () => {
    const provider = new CapturingProvider();
    const { context } = makeContext();
    const agent = new Agent(provider, context);

    await agent.ask('first');
    const firstTools = provider.tools;
    await firstTools.submit_query_plan!.execute(plan(), { toolCallId: 't', messages: [] });

    await agent.ask('second');
    const result = await provider.tools.execute_query!.execute(
      { sql: 'SELECT 1' },
      { toolCallId: 't', messages: [] },
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/submit_query_plan/);
  });
});

// ---------------------------------------------------------------------------
// Plan schema (shape only; semantic checks are listed as todo below)
// ---------------------------------------------------------------------------

describe('query plan schema', () => {
  const invalid: Array<[string, Record<string, unknown>]> = [
    ['empty objective', { objective: '   ' }],
    ['no tables', { tables: [] }],
    ['blank table name', { tables: [' '] }],
    ['too many tables', { tables: Array.from({ length: 21 }, (_, i) => `t${i}`) }],
    ['objective over 500 chars', { objective: 'x'.repeat(501) }],
    ['non-string field', { requiredFields: [42] }],
  ];

  it.each(invalid)('rejects %s', async (_label, override) => {
    const { call } = await setup();
    const r = await call('submit_query_plan', plan(override));
    expect(r.success).toBe(false);
    expect(typeof r.error).toBe('string');
  });

  it('accepts a minimal valid plan and trims strings', async () => {
    const { call } = await setup();
    const r = await call('submit_query_plan', plan({ objective: '  Count clients  ' }));
    expect(r.success).toBe(true);
    expect(r.data.plan.objective).toBe('Count clients');
  });

  it('accepts optional aggregations and sorting', async () => {
    const { call } = await setup();
    const r = await call('submit_query_plan', plan({ aggregations: ['COUNT(*)'], sorting: ['id DESC'] }));
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Other execute_query gates still hold with the plan in place
// ---------------------------------------------------------------------------

describe('execute_query limits with a plan', () => {
  it('blocks an unchanged repeat query, ignoring case and whitespace', async () => {
    const { call, executed } = await setup();
    await call('submit_query_plan', plan());

    await call('execute_query', { sql: 'SELECT COUNT(*) FROM clients' });
    const repeat = await call('execute_query', { sql: 'select   count(*)\nfrom clients;' });

    expect(repeat.success).toBe(false);
    expect(repeat.error).toMatch(/already been attempted/);
    expect(executed).toHaveLength(1);
  });

  it('does not treat different string literals as the same query', async () => {
    const { call, executed } = await setup();
    await call('submit_query_plan', plan());

    await call('execute_query', { sql: "SELECT * FROM clients WHERE name = 'Ann'" });
    await call('execute_query', { sql: "SELECT * FROM clients WHERE name = 'ann'" });

    expect(executed).toHaveLength(2);
  });

  it('stops after three executed queries', async () => {
    const { call, executed, recorder } = await setup();
    await call('submit_query_plan', plan());

    for (let i = 1; i <= 3; i += 1) {
      expect((await call('execute_query', { sql: `SELECT ${i}` })).success).toBe(true);
    }
    const fourth = await call('execute_query', { sql: 'SELECT 4' });

    expect(fourth.success).toBe(false);
    expect(fourth.error).toMatch(/Maximum of 3/);
    expect(executed).toHaveLength(3);
    expect((recorder.ends('execute_query').at(-1) as any).databaseExecutionAttempted).toBe(false);
  });

  it('reports databaseExecutionAttempted=false on every rejection the agent makes', async () => {
    const { call, recorder } = await setup();
    await call('submit_query_plan', plan());
    await call('execute_query', { sql: 'SELECT 1' });
    await call('execute_query', { sql: 'SELECT 1' }); // duplicate

    const ends = recorder.ends('execute_query') as any[];
    const duplicate = ends[1];
    expect(duplicate.success).toBe(false);
    expect(duplicate.databaseExecutionAttempted).toBe(false);
  });

  it('still rejects write SQL even with a valid plan', async () => {
    const { call, executed } = await setup();
    await call('submit_query_plan', plan());

    const r = await call('execute_query', { sql: 'DELETE FROM clients' });

    expect(r.success).toBe(false);
    expect(executed).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Foreign-key discovery gate
// ---------------------------------------------------------------------------

describe('foreign-key discovery', () => {
  it('runs before the model and is visible to it', async () => {
    const { provider, recorder } = await setup({
      relationships: async () => [
        { table: 'transactions', column: 'client_id', referencedTable: 'clients', referencedColumn: 'id' },
      ],
    });

    expect(provider.system).toContain('GLOBAL FOREIGN-KEY DISCOVERY RESULTS');
    expect(provider.system).toContain('transactions');
    expect(recorder.events[0]).toMatchObject({ type: 'tool-start', name: 'get_relationships' });
  });

  it('blocks execution when discovery failed, until the model fetches relationships itself', async () => {
    const { call, executed, provider } = await setup({
      relationships: async () => {
        throw new Error('permission denied');
      },
    });
    expect(provider.system).toContain('GLOBAL FOREIGN-KEY DISCOVERY FAILED');

    await call('submit_query_plan', plan());
    const blocked = await call('execute_query', { sql: 'SELECT 1' });
    expect(blocked.success).toBe(false);
    expect(blocked.error).toMatch(/foreign-key discovery/i);
    expect(executed).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Prompt contract
// ---------------------------------------------------------------------------

describe('prompt contract', () => {
  it('tells the model the plan is mandatory and read-only rules apply', async () => {
    const { provider } = await setup();
    expect(provider.system).toContain('MUST call submit_query_plan');
    expect(provider.system).toContain('read-only');
    expect(provider.system).toMatch(/budget of 8 steps/);
  });
});

// ---------------------------------------------------------------------------
// Behaviour the design calls for but the code does not do yet. These are todo
// markers: turn each into a real test as the feature lands.
// ---------------------------------------------------------------------------

describe('planned: semantic plan validation', () => {
  it.todo('rejects a plan naming a table that does not exist, and lists the real tables');
  it.todo('rejects a plan field whose column is not on the named table');
  it.todo('rejects a plan join that is not a known foreign key, naming the real foreign keys');
  it.todo('accepts a plan whose joins follow the discovered foreign keys');
  it.todo('compares table names case-sensitively on postgres and insensitively on mysql');
});

describe('planned: SQL must follow the plan', () => {
  it.todo('rejects SQL that reads a table not in the plan, telling the model to resubmit the plan');
  it.todo('accepts SQL whose FROM/JOIN tables are a subset of the plan tables');
  it.todo('ignores CTE names when comparing SQL tables to plan tables');
  it.todo('allows the new SQL after the plan is resubmitted with the extra table');
});

describe('planned: limits and metrics', () => {
  it.todo('stops accepting plans after the cap and returns the last validation error');
  it.todo('reports planSubmissions and plansRejected in the agent result for the eval report');
  it.todo('does not count SQL-validator rejections as query attempts (or documents that it does)');
});
