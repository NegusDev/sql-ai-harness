import { describe, expect, it } from 'vitest';
import { Agent } from '../src/core/agent/agent.js';
import type { ModelRequest, ModelResponse, ToolContext } from '../src/core/types/index.js';

class FakeProvider {
  readonly name = 'fake';
  lastRequest?: ModelRequest;

  async generate(request: ModelRequest): Promise<ModelResponse> {
    this.lastRequest = request;
    return { text: 'The database is a school management system.' };
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

describe('Agent database context', () => {
  it('works without database context', async () => {
    const provider = new FakeProvider();
    await new Agent(provider, context).ask('What is this database about?');

    expect(provider.lastRequest?.system).not.toContain('<DATABASE_CONTEXT>');
  });

  it('includes optional user-defined database context when provided', async () => {
    const provider = new FakeProvider();
    const agent = new Agent(provider, context, {
      databaseContext: {
        content: 'This database belongs to a school management system.',
        source: '/tmp/sql-ai.md',
      },
    });

    await agent.ask('What is this database about?');

    expect(provider.lastRequest?.system).toContain('<DATABASE_CONTEXT>');
    expect(provider.lastRequest?.system).toContain(
      'This database belongs to a school management system.',
    );
  });
});
