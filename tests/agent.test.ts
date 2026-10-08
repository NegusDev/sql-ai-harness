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
  });
});


describe('Agent response modes', () => {
  it.each([
    ['natural', 'concise, natural-language answer'],
    ['technical', 'technical terminology'],
    ['debug', 'technical details'],
  ] as const)('configures %s response instructions', async (mode, expected) => {
    const provider = new FakeProvider();
    await new Agent(provider, context, { responseMode: mode }).ask('How many students?');

    expect(provider.lastRequest?.system).toContain(expected);
  });
});
