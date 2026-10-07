import {dynamicTool, type ToolSet } from 'ai';
import { z } from 'zod';
import type { AiProvider } from '../../ai/provider.js';
import type { ToolContext } from '../types/index.js';
import { getTools } from '../tools/registry.js';

const emptyInput = z.object({}).strict();

const schemas = {
  list_tables: emptyInput,
  describe_table: z.object({
    table: z.string().min(1).describe('The exact database table name to inspect.'),
  }),
  get_relationships: z.object({
    table: z.string().min(1).optional().describe('Optional table name. Omit to inspect all foreign-key relationships.'),
  }),
  execute_query: z.object({
    sql: z.string().min(1).describe('A read-only SELECT or WITH SQL query.'),
  }),
  explain_query: z.object({
    sql: z.string().min(1).describe('A read-only SELECT or WITH SQL query to explain.'),
  }),
};

export interface AgentOptions {
  maxSteps?: number;
  temperature?: number;
}

export interface AgentResult {
  text: string;
  steps: number;
  toolCalls: number;
  raw?: unknown;
}

/**
 * Application-level agent. Provider-specific model calls stay behind AiProvider;
 * database access stays behind ToolContext and the tool registry.
 */
export class Agent {
  constructor(
    private readonly provider: AiProvider,
    private readonly context: ToolContext,
    private readonly options: AgentOptions = {},
  ) {}

  async ask(question: string): Promise<AgentResult> {
    const prompt = question.trim();
    if (!prompt) throw new Error('Question is required.');

    const tools = this.buildTools();
    const result = await this.provider.generate({
      system: [
        'You are SQL AI Harness, a database analysis assistant.',
        'Answer questions using the connected relational database.',
        'Do not invent schema, columns, rows, or results.',
        'Use schema discovery tools before writing SQL when the schema is not known.',
        'Only use the provided tools for database access.',
        'Only perform read-only analysis. Never attempt INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, or other mutations.',
        'When a query fails, inspect the error and correct the query using the available schema tools.',
        'Give a concise final answer based on the actual query results.',
        'When useful, mention the SQL used and relevant execution details, but do not expose hidden chain-of-thought.',
      ].join('\n'),
      prompt,
      tools,
      temperature: this.options.temperature ?? 0,
      maxSteps: this.options.maxSteps ?? 8,
    });

    return {
      text: result.text,
      steps: result.steps ?? 1,
      toolCalls: result.toolCalls ?? 0,
      raw: result.raw,
    };
  }

  private buildTools(): ToolSet {
    const registered = getTools();
    const toolSet: ToolSet = {};

    for (const registeredTool of registered) {
      const schema = schemas[registeredTool.name];
      toolSet[registeredTool.name] = dynamicTool({
        description: registeredTool.description,
        inputSchema: schema,
        // input is typed as 'unknown' — validate/cast at runtime
        execute: async (input) => registeredTool.execute(input, this.context),
      });
    }

    return toolSet;
  }
}
