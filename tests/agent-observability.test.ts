import { describe, expect, it } from 'vitest';
import type { ToolSet } from 'ai';
import { Agent } from '../src/core/agent/agent.js';
import type {
  AgentObserver,
  AgentToolEvent,
} from '../src/core/agent/observability.js';
import type { AiProvider } from '../src/ai/provider.js';
import type {
  ModelRequest,
  ModelResponse,
  ToolContext,
} from '../src/core/types/index.js';

class RecordingProvider implements AiProvider {
  readonly name = 'test';

  async generate(
    request: ModelRequest & { tools?: ToolSet },
  ): Promise<ModelResponse> {
    expect(request.tools).toBeDefined();
    return { text: 'done', steps: 1, toolCalls: 0 };
  }
}

class RecordingObserver implements AgentObserver {
  events: AgentToolEvent[] = [];

  onToolEvent(event: AgentToolEvent): void {
    this.events.push(event);
  }
}

describe('Agent observability', () => {
  it('does not emit hidden reasoning when no model tools are called', async () => {
    const observer = new RecordingObserver();
    const provider = new RecordingProvider();

    const context: ToolContext = {
      safety: {
        readOnly: true,
        maxRows: 100,
        queryTimeoutMs: 5000,
        maxResultBytes: 100000,
      },
      database: {
        dialect: 'mysql',
        listTables: async () => [],
        describeTable: async () => ({
          table: { name: 'users' },
          columns: [],
        }),
        getRelationships: async () => [],
        executeQuery: async () => ({
          rows: [],
          rowCount: 0,
          executionTimeMs: 1,
        }),
        explainQuery: async () => ({
          sql: 'SELECT 1',
          plan: [],
        }),
      },
    };

    const result = await new Agent(provider, context, { observer }).ask('hello');

    expect(result.text).toBe('done');
    expect(result.toolCalls).toBe(0);

    // Automatic discovery is expected, but it must not expose model reasoning.
    expect(observer.events).toEqual([
      expect.objectContaining({
        type: 'tool-start',
        name: 'get_relationships',
        input: {},
      }),
      expect.objectContaining({
        type: 'tool-end',
        name: 'get_relationships',
        input: {},
        success: true,
        data: [],
      }),
    ]);

    // Observer events must contain tool activity, not hidden reasoning.
    for (const event of observer.events) {
      expect(event).not.toHaveProperty('reasoning');
      expect(event).not.toHaveProperty('chainOfThought');
    }
  });
});
