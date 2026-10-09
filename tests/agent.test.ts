import { describe, expect, it } from 'vitest';
import { Agent } from '../src/core/agent/agent.js';
import type { ModelRequest, ModelResponse, ToolContext } from '../src/core/types/index.js';

class FakeProvider {
  readonly name = 'fake';
  lastRequest?: ModelRequest;

  async generate(request: ModelRequest): Promise<ModelResponse> {
    this.lastRequest = request;
    return { text: 'There are 10 students.', steps: 2, toolCalls: 1 };
  }
}

const context: ToolContext = {
  database: {
    dialect: 'mysql',
    async listTables() { return []; },
    async describeTable() { throw new Error('not used'); },
    async getRelationships() { return []; },
    async executeQuery() { return { rows: [], rowCount: 0, executionTimeMs: 0 }; },
    async explainQuery() { return { sql: 'SELECT 1', plan: [] }; },
  },
  safety: {
    readOnly: true,
    maxRows: 500,
    queryTimeoutMs: 10_000,
    maxResultBytes: 1_048_576,
  },
};

describe('Agent', () => {
  it('builds the database tool set and sends the question to the provider', async () => {
    const provider = new FakeProvider();
    const agent = new Agent(provider, context, { maxSteps: 5 });

    const result = await agent.ask('How many students are enrolled?');

    expect(result.text).toBe('There are 10 students.');
    expect(provider.lastRequest?.prompt).toBe('How many students are enrolled?');
    expect(provider.lastRequest?.tools).toBeDefined();
    expect(Object.keys(provider.lastRequest?.tools as object)).toEqual([
      'list_tables',
      'describe_table',
      'describe_tables',
      'get_relationships',
      'execute_query',
      'explain_query',
    ]);
    expect(provider.lastRequest?.maxSteps).toBe(5);
    expect(provider.lastRequest?.system).toContain('Relationship discovery is a required planning step');
    expect(provider.lastRequest?.system).toContain('evaluate the actual returned columns and rows');
    expect(provider.lastRequest?.system).toContain('human-readable fields');
  });
});


describe('Agent response modes', () => {
  it.each([
    ['natural', 'clear, direct answer in plain language suitable'],
    ['technical', 'technical terminology'],
    ['debug', 'technical details'],
  ] as const)('configures %s response instructions', async (mode, expected) => {
    const provider = new FakeProvider();
    await new Agent(provider, context, { responseMode: mode }).ask('How many students?');

    expect(provider.lastRequest?.system).toContain(expected);
  });
});

describe('Agent query correctness safeguards', () => {
  it('requires global relationship discovery and caps SQL execution attempts at three', async () => {
    let executedQueries = 0;
    const probe = {
      name: 'tool-probe',
      results: [] as Array<{ success: boolean; error?: string }>,
      async generate(request: ModelRequest): Promise<ModelResponse> {
        const tools = request.tools as Record<string, {
          execute?: (input: unknown) => Promise<{ success: boolean; error?: string }>;
        }>;

        this.results.push(await tools.execute_query.execute!({ sql: 'SELECT id FROM users' }));
        this.results.push(await tools.get_relationships.execute!({ table: 'users' }));
        this.results.push(await tools.execute_query.execute!({ sql: 'SELECT id FROM users' }));
        this.results.push(await tools.get_relationships.execute!({}));
        this.results.push(await tools.execute_query.execute!({ sql: 'SELECT id FROM users' }));
        this.results.push(await tools.execute_query.execute!({ sql: 'SELECT id FROM users' }));
        this.results.push(await tools.execute_query.execute!({ sql: 'SELECT id FROM users' }));
        this.results.push(await tools.execute_query.execute!({ sql: 'SELECT id FROM users' }));
        return { text: 'done' };
      },
    };

    const probeContext: ToolContext = {
      ...context,
      database: {
        ...context.database,
        async executeQuery() {
          executedQueries += 1;
          return { rows: [{ id: executedQueries }], rowCount: 1, executionTimeMs: 1 };
        },
      },
    };

    await new Agent(probe, probeContext).ask('List active users');

    expect(probe.results[0].success).toBe(false);
    expect(probe.results[0].error).toContain('global foreign-key discovery');
    expect(probe.results[2].success).toBe(false);
    expect(executedQueries).toBe(3);
    expect(probe.results.at(-1)?.success).toBe(false);
    expect(probe.results.at(-1)?.error).toContain('Maximum of 3 SQL query attempts');
  });
});
