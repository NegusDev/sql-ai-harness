import { dynamicTool, type ToolSet } from "ai";
import { z } from "zod";
import type { AiProvider } from "../../ai/provider.js";
import type { DatabaseContext, SqlToolResult, ToolContext } from '../types/index.js';
import { noopAgentObserver, type AgentObserver } from "./observability.js";
import { getTools } from "../tools/registry.js";

const emptyInput = z.object({}).strict();

const schemas = {
  list_tables: emptyInput,
  describe_tables: z.object({
    tables: z.array(z.string().min(1)).min(1).max(10),
  }),
  describe_table: z.object({
    table: z
      .string()
      .min(1)
      .describe("The exact database table name to inspect."),
  }),
  get_relationships: z.object({
    table: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Optional table name. Omit to inspect all foreign-key relationships.",
      ),
  }),
  execute_query: z.object({
    sql: z.string().min(1).describe("A read-only SELECT or WITH SQL query."),
  }),
  explain_query: z.object({
    sql: z
      .string()
      .min(1)
      .describe("A read-only SELECT or WITH SQL query to explain."),
  }),
};

export type ResponseMode = "natural" | "technical" | "debug";

export interface AgentOptions {
  maxSteps?: number;
  databaseContext?: DatabaseContext;
  responseMode?: ResponseMode;

  temperature?: number;
  observer?: AgentObserver;
}

export interface AgentResult {
  text: string;
  steps: number;
  toolCalls: number;
  raw?: unknown;
}

interface AskRuntime {
  relationshipsInspected: boolean;
  queryAttempts: number;
}

const DEFAULT_MAX_QUERY_ATTEMPTS = 3;

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
    if (!prompt) throw new Error("Question is required.");

    const runtime: AskRuntime = {
      relationshipsInspected: false,
      queryAttempts: 0,
    };
    const tools = this.buildTools(runtime);
    const result = await this.provider.generate({
      system: [
        "You are SQL AI Harness, a database analysis assistant.",
        "Answer questions using the connected relational database.",
        "Do not invent schema, columns, rows, or results.",
        "Use schema discovery tools before writing SQL when the schema is not known.",
        "When several tables are relevant, prefer describe_tables to multiple separate describe_table calls.",
        "Before every SQL execution, inspect foreign-key relationships with get_relationships. Relationship discovery is a required planning step, not an optional hint.",
        "Plan the query before writing SQL: identify the requested entities, relevant tables, output fields, filters, and any foreign-key path needed to connect those tables.",
        "When the question requires data from related tables, use explicit JOINs that follow the discovered foreign-key relationships. Do not guess join columns or substitute foreign-key IDs for the related entity’s descriptive fields.",
        "Choose result columns that answer the user’s wording. For requests to list or show people or named entities, prefer available human-readable fields such as names, usernames, or email addresses rather than returning only numeric IDs. Use IDs when the user asks for identifiers, counts, or when no descriptive fields exist.",
        "After each query, evaluate the actual returned columns and rows against the original question before answering. A successful SQL execution does not by itself mean the question was answered. If the result contains only IDs when descriptive fields were requested, omits a required related entity, or otherwise fails to answer the question, inspect the schema/relationships and correct the query before giving the final answer.",
        `You may execute at most ${DEFAULT_MAX_QUERY_ATTEMPTS} SQL query attempts for this question. Use those attempts to correct errors or improve an inadequate result; do not repeat an unchanged query.`,
        "Only use the provided tools for database access.",
        "Only perform read-only analysis. Never attempt INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, or other mutations.",
        "When a query fails, inspect the error and correct the query using the available schema tools.",
        ...this.responseInstructions(),
        ...(this.options.databaseContext?.content
          ? [
              "",
              "The user has provided the following optional database context.",
              "Use it to understand the business/domain meaning of the database, but treat the live database schema and query results as authoritative for what actually exists.",
              "",
              "<DATABASE_CONTEXT>",
              this.options.databaseContext.content,
              "</DATABASE_CONTEXT>",
            ]
          : []),
      ].join("\n"),
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

  private responseInstructions(): string[] {
    switch (this.options.responseMode ?? "natural") {
      case "technical":
        return [
          "Give a concise final answer based on the actual query results.",
          "Use technical terminology where useful and include the SQL used when relevant.",
          "Do not expose hidden chain-of-thought.",
        ];
      case "debug":
        return [
          "Give a concise final answer based on the actual query results.",
          "Include useful technical details such as SQL, assumptions, and relevant execution information.",
          "Do not expose hidden chain-of-thought.",
        ];
      case "natural":
      default:
        return [
          "Give a clear, direct answer in plain language suitable for a non-technical audience.",
          "Use business-friendly terminology and completely avoid technical jargon, database names, or raw SQL.",
          "Focus on practical insights and answers rather than how the data was gathered or calculated.",
          "Do not expose hidden chain-of-thought.",
        ];
    }
  }

  private buildTools(runtime: AskRuntime): ToolSet {
    const registered = getTools();
    const toolSet: ToolSet = {};

    for (const registeredTool of registered) {
      const schema = schemas[registeredTool.name];
      toolSet[registeredTool.name] = dynamicTool({
        description: registeredTool.description,
        inputSchema: schema,
        // input is typed as 'unknown' — validate/cast at runtime
        execute: async (input) => {
          const observer = this.options.observer ?? noopAgentObserver;
          const startedAt = performance.now();

          observer.onToolEvent({
            type: "tool-start",
            name: registeredTool.name,
            input,
          });

          try {
            let result: SqlToolResult;

            if (
              registeredTool.name === "execute_query" &&
              !runtime.relationshipsInspected
            ) {
              result = {
                success: false,
                error:
                  "Query planning requires global foreign-key discovery first. Call get_relationships without a table argument, then build SQL using the returned relationships where relevant.",
              };
            } else if (
              registeredTool.name === "execute_query" &&
              runtime.queryAttempts >= DEFAULT_MAX_QUERY_ATTEMPTS
            ) {
              result = {
                success: false,
                error: `Maximum of ${DEFAULT_MAX_QUERY_ATTEMPTS} SQL query attempts reached. Use the existing results to provide the best supported answer, and clearly state any limitation.`,
              };
            } else {
              if (registeredTool.name === "execute_query")
                runtime.queryAttempts += 1;
              result = await registeredTool.execute(input, this.context);
              if (
                registeredTool.name === "get_relationships" &&
                result.success
              ) {
                const relationshipInput = input as
                  { table?: unknown } | undefined;
                if (!String(relationshipInput?.table ?? "").trim()) {
                  runtime.relationshipsInspected = true;
                }
              }
            }

            observer.onToolEvent({
              type: "tool-end",
              name: registeredTool.name,
              input,
              success: result.success,
              durationMs: Math.round(performance.now() - startedAt),
              data: result.success ? result.data : undefined,
              error: result.success ? undefined : result.error,
            });

            return result;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            observer.onToolEvent({
              type: "tool-end",
              name: registeredTool.name,
              input,
              success: false,
              durationMs: Math.round(performance.now() - startedAt),
              error: message,
            });

            throw error;
          }
        },
      });
    }

    return toolSet;
  }
}
