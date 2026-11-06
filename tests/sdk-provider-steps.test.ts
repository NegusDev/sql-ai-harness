import { jsonSchema, tool } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import { SdkAiProvider } from '../src/ai/sdk-provider.js';

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

/** A model that keeps calling its tool until tools are disabled for the step. */
function greedyModel() {
  let calls = 0;
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      calls += 1;
      const toolsDisabled = options.toolChoice?.type === 'none';

      return toolsDisabled
        ? {
            content: [{ type: 'text', text: 'final answer' }],
            finishReason: { unified: 'stop', raw: undefined },
            usage,
            warnings: [],
          }
        : {
            content: [
              { type: 'tool-call', toolCallId: `c${calls}`, toolName: 'lookup', input: '{}' },
            ],
            finishReason: { unified: 'tool-calls', raw: undefined },
            usage,
            warnings: [],
          };
    },
  });
}

const tools = {
  lookup: tool({
    description: 'lookup',
    inputSchema: jsonSchema({ type: 'object', properties: {} }),
    execute: async () => ({ ok: true }),
  }),
};

describe('SdkAiProvider step budget', () => {
  it('reserves the last step for a text answer', async () => {
    const provider = new SdkAiProvider('mock', greedyModel());
    const result = await provider.generate({ prompt: 'q', tools, maxSteps: 3 });

    expect(result.text).toBe('final answer');
    expect(result.steps).toBe(3);
    expect(result.toolCalls).toBe(2);
  });

  it('still allows tools on every step before the last', async () => {
    const model = greedyModel();
    await new SdkAiProvider('mock', model).generate({ prompt: 'q', tools, maxSteps: 4 });

    const choices = model.doGenerateCalls.map((call) => call.toolChoice?.type ?? 'auto');
    expect(choices).toEqual(['auto', 'auto', 'auto', 'none']);
  });
});
