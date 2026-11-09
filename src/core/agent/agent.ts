// agent.ts
import { dynamicTool, type ToolSet } from "ai";
import { z } from "zod";
import type { AiProvider } from "../../ai/provider.js";
import type {
  DatabaseContext,
  SqlToolResult,
  ToolContext,
} from "../types/index.js";
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

const queryPlanSchema = z.object({
  objective: z.string().trim().min(1).max(500),
  tables: z.array(z.string().trim().min(1)).min(1).max(20),
  requiredFields: z.array(z.string().trim().min(1)).max(30),
  filters: z.array(z.string().trim().min(1)).max(30),
  joins: z.array(z.string().trim().min(1)).max(20),
  aggregations: z.array(z.string().trim().min(1)).max(20).optional(),
  sorting: z.array(z.string().trim().min(1)).max(20).optional(),
});

export type QueryPlan = z.infer<typeof queryPlanSchema>;

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
  /**
   * True when the model produced no final answer (for example it ran out of
   * steps). `text` then holds an explanation instead of an answer.
   */
  incomplete?: boolean;
}

interface AskRuntime {
  relationshipsInspected: boolean;
  queryPlan?: QueryPlan;
  planSubmissions: number;
  queryAttempts: number;
  attemptedQueries: Set<string>;
}

const DEFAULT_MAX_QUERY_ATTEMPTS = 3;


/**
 * Normalize insignificant SQL formatting differences while preserving
 * the contents and case of quoted strings and identifiers.
 */
function normalizeSql(sql: string): string {
  let normalized = "";
  let quote: "'" | '"' | "`" | null = null;
  let pendingSpace = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (quote) {
      normalized += char;

      // Handle SQL escaped quotes, e.g. 'it''s'.
      if (char === quote) {
        if (next === quote) {
          normalized += next;
          i++;
        } else {
          quote = null;
        }
      } else if (char === "\\" && next) {
        normalized += next;
        i++;
      }

      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      if (pendingSpace && normalized.length > 0) {
        normalized += " ";
      }

      pendingSpace = false;
      quote = char;
      normalized += char;
      continue;
    }

    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace && normalized.length > 0) {
      normalized += " ";
    }

    pendingSpace = false;
    normalized += char.toLowerCase();
  }

  return normalized.trim().replace(/;+\s*$/, "");
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
    if (!prompt) throw new Error("Question is required.");

    const runtime: AskRuntime = {
      relationshipsInspected: false,
      planSubmissions: 0,
      queryAttempts: 0,
      attemptedQueries: new Set<string>(),
    };

    const relationshipResult = await this.discoverRelationships();

    runtime.relationshipsInspected = relationshipResult.success;

    const relationshipContext = relationshipResult.success
      ? [
          "",
          "GLOBAL FOREIGN-KEY DISCOVERY RESULTS:",
          JSON.stringify(relationshipResult.data),
          "Use these actual relationships when constructing joins. Global relationship discovery has already been completed; do not repeat it unless more information is needed.",
        ]
      : [
          "",
          "GLOBAL FOREIGN-KEY DISCOVERY FAILED:",
          relationshipResult.error ?? "Unknown error",
          "Do not execute SQL until relationship discovery succeeds.",
      ];

    const tools = this.buildTools(runtime);
    const result = await this.provider.generate({
      system: [
        "You are SQL AI Harness, a database analysis assistant.",
        "Answer questions using the connected relational database.",
        "Do not invent schema, columns, rows, or results.",
        "Use schema discovery tools before writing SQL when the schema is not known.",
        "When several tables are relevant, prefer describe_tables to multiple separate describe_table calls.",
        "Global foreign-key discovery has already been performed before this model call. Use its results when planning joins. Call get_relationships again only when additional relationship information is needed.",
        ...relationshipContext,
        "Before calling execute_query, you MUST call submit_query_plan with a concise structured plan. This is mandatory for every question that requires SQL, including simple queries.",
        "Discover the relevant schema first, then submit the plan. The plan must identify the objective, relevant tables, required fields, filters, joins, and any aggregations or sorting.",
        "The harness blocks execute_query until submit_query_plan has accepted a plan. If your approach materially changes after inspecting results or errors, submit an updated plan before executing the revised SQL.",
        "Plan the query before writing SQL: identify the requested entities, relevant tables, output fields, filters, and any foreign-key path needed to connect those tables.",
        "When the question requires data from related tables, use explicit JOINs that follow the discovered foreign-key relationships. Do not guess join columns or substitute foreign-key IDs for the related entity’s descriptive fields.",
        "Choose result columns that answer the user’s wording. For requests to list or show people or named entities, prefer available human-readable fields such as names, usernames, or email addresses rather than returning only numeric IDs. Use IDs when the user asks for identifiers, counts, or when no descriptive fields exist.",
        "After each query, inspect the actual result. A successful query returning zero rows is a valid result, not automatically a query failure. Report that no matching records were found when that is what the result establishes. Do not broaden filters or remove conditions merely to obtain rows.",
        "If a query returns zero rows, retry only when you can identify a specific, evidence-based reason the query may be wrong, such as an incorrect join, column, or filter. Do not retry an unchanged query.",
        `You may execute at most ${DEFAULT_MAX_QUERY_ATTEMPTS} SQL queries for this question. The tool enforces this limit. Once it is reached, do not call execute_query again; answer using the evidence already collected and clearly state any limitation.`,
        `You have a budget of ${this.options.maxSteps ?? 8} steps. The last step cannot call tools and is reserved for your final answer, so finish gathering data before then and always end with a written answer.`,
        "This assistant is read-only. If asked to insert, update, delete, drop, truncate, create or alter anything, to run administrative commands, or to read files on the database server, decline in one or two sentences without calling execute_query, and say what you can do instead (for example, query the data).",
        ...this.dialectInstructions(),
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

    const steps = result.steps ?? 1;

    if (!result.text.trim()) {
      return {
        text:
          `The model finished without an answer after ${steps} step${steps === 1 ? '' : 's'}. ` +
          'Try a narrower question, or raise AGENT_MAX_STEPS.',
        steps,
        toolCalls: result.toolCalls ?? 0,
        raw: result.raw,
        incomplete: true,
      };
    }

    return {
      text: result.text,
      steps,
      toolCalls: result.toolCalls ?? 0,
      raw: result.raw,
    };
  }

  private dialectInstructions(): string[] {
    const common =
      'If an execute_query result has truncated: true, more rows exist than were returned. Do not present counts, sums, or "all of" statements computed from it as complete; aggregate in SQL instead or say the result is partial.';

    if (this.context.database.dialect === 'postgres') {
      return [
        'The database is PostgreSQL. Use PostgreSQL syntax (LIMIT, ILIKE, ::casts, date_trunc, etc.).',
        'Use table names exactly as list_tables returns them (schema-qualified when shown). Wrap identifiers containing capitals, spaces or special characters in double quotes; use single quotes only for string values.',
        common,
      ];
    }

    return [
      'The database is MySQL/MariaDB. Use MySQL syntax and wrap identifiers that need quoting in backticks.',
      common,
    ];
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
      const observer = this.options.observer ?? noopAgentObserver;

      if (
        registered.some(
          (tool) => String(tool.name) === "submit_query_plan",
        )
      ) {
        throw new Error(
          'Tool name collision: "submit_query_plan" is reserved by the agent.',
        );
      }

      toolSet.submit_query_plan = dynamicTool({
        description:
          "Submit the structured query plan after schema discovery and before executing SQL. Required before every execute_query call. Submit an updated plan if the query approach materially changes.",
        inputSchema: queryPlanSchema,
        execute: async (input) => {
          const startedAt = performance.now();

          observer.onToolEvent({
            type: "tool-start",
            name: "submit_query_plan",
            input,
          });

          try {
            const parsed = queryPlanSchema.safeParse(input);
            if (!parsed.success) {
              const message = parsed.error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join("; ");

              observer.onToolEvent({
                type: "tool-end",
                name: "submit_query_plan",
                input,
                success: false,
                durationMs: Math.round(performance.now() - startedAt),
                error: message,
              });

              return { success: false, error: message };
            }

            runtime.queryPlan = parsed.data;
            runtime.planSubmissions += 1;

            const result = {
              success: true,
              data: {
                accepted: true,
                submission: runtime.planSubmissions,
                plan: runtime.queryPlan,
              },
            };

            observer.onToolEvent({
              type: "tool-end",
              name: "submit_query_plan",
              input,
              success: true,
              durationMs: Math.round(performance.now() - startedAt),
              data: result.data,
            });

            return result;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);

            observer.onToolEvent({
              type: "tool-end",
              name: "submit_query_plan",
              input,
              success: false,
              durationMs: Math.round(performance.now() - startedAt),
              error: message,
            });

            throw error;
          }
        },
      });

      for (const registeredTool of registered) {
        const schema = schemas[registeredTool.name];
        if (!schema) {
          throw new Error(
            `No input schema is defined for registered tool "${registeredTool.name}".`,
          );
        }

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

              const isQuery = registeredTool.name === "execute_query";
              const queryInput = input as { sql?: unknown } | undefined;
              const sql =
                typeof queryInput?.sql === "string" ? queryInput.sql.trim() : "";

              const normalizedSql = isQuery ? normalizeSql(sql) : "";

              if (isQuery && !runtime.queryPlan) {
                result = {
                  success: false,
                  executionAttempted: false,
                  error:
                    "No query plan has been submitted. Call submit_query_plan with the structured plan before executing SQL.",
                };
              } else if (isQuery && !runtime.relationshipsInspected) {
                result = {
                  success: false,
                  executionAttempted: false,
                  error:
                    "Query planning requires global foreign-key discovery first. Call get_relationships without a table argument, then build SQL using the returned relationships where relevant.",
                };
              } else if (
                isQuery &&
                runtime.attemptedQueries.has(normalizedSql)
              ) {
                result = {
                  success: false,
                  error:
                    "This SQL query has already been attempted. Do not retry it unchanged. Use the previous result or error to identify a concrete correction, or provide the best supported answer.",
                };
              } else if (
                isQuery &&
                runtime.queryAttempts >= DEFAULT_MAX_QUERY_ATTEMPTS
              ) {
                result = {
                  success: false,
                  executionAttempted: false,
                  error: `Maximum of ${DEFAULT_MAX_QUERY_ATTEMPTS} SQL query attempts reached. Use the existing results to provide the best supported answer, and clearly state any limitation.`,
                };
              } else {
                if (isQuery) {
                  // Count only queries that are actually passed to the registered tool.
                  runtime.attemptedQueries.add(normalizedSql);
                  runtime.queryAttempts += 1;
                }

                result = await registeredTool.execute(input, this.context);

                if (
                  registeredTool.name === "get_relationships" &&
                  result.success
                ) {
                  const relationshipInput = input as
                    | { table?: unknown }
                    | undefined;

                  if (!String(relationshipInput?.table ?? "").trim()) {
                    runtime.relationshipsInspected = true;
                  }
                }
              }

              observer.onToolEvent({
                type: 'tool-end',
                name: registeredTool.name,
                input,
                success: result.success,
                durationMs: Math.round(performance.now() - startedAt),
                data: result.success ? result.data : undefined,
                error: result.success ? undefined : result.error,
                ...(registeredTool.name === 'execute_query'
                  ? { databaseExecutionAttempted: result.executionAttempted ?? false }
                  : {}),
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
                databaseExecutionAttempted: false,
              });

              throw error;
            }
          },
        });
      }

      return toolSet;
    }

  private async discoverRelationships(): Promise<SqlToolResult> {
    const relationshipTool = getTools().find(
      (tool) => tool.name === "get_relationships",
    );

    if (!relationshipTool) {
      return {
        success: false,
        error: "The get_relationships tool is not registered.",
      };
    }

    const observer = this.options.observer ?? noopAgentObserver;
    const startedAt = performance.now();
    const input = {};

    observer.onToolEvent({
      type: "tool-start",
      name: "get_relationships",
      input,
    });

    try {
      const result = await relationshipTool.execute(input, this.context);

      observer.onToolEvent({
        type: "tool-end",
        name: "get_relationships",
        input,
        success: result.success,
        durationMs: Math.round(performance.now() - startedAt),
        data: result.success ? result.data : undefined,
        error: result.success ? undefined : result.error,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      observer.onToolEvent({
        type: "tool-end",
        name: "get_relationships",
        input,
        success: false,
        durationMs: Math.round(performance.now() - startedAt),
        error: message,
      });

      return { success: false, error: message };
    }
  }
}
