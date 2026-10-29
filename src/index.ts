/**
 * Public SDK entry point for SQL AI Harness.
 *
 * Keep this file as the supported import surface. Consumers should not need to
 * import implementation files from internal src/ paths.
 */

export { Agent } from './core/agent/index.js';
export type {
  AgentOptions,
  AgentResult,
  ResponseMode,
} from './core/agent/agent.js';
export type {
  AgentObserver,
  AgentToolEvent,
} from './core/agent/observability.js';

export type { AiProvider } from './ai/provider.js';
export { SdkAiProvider } from './ai/sdk-provider.js';
export { createAiProvider } from './ai/factory.js';

export { loadConfig } from './config/config.js';
export type { AppConfig, AiProviderName } from './config/config.js';

export { MySqlAdapter } from './database/index.js';
export type { MySqlAdapterConfig, DatabaseAdapter } from './database/index.js';

export type {
  ColumnInfo,
  DatabaseContext,
  ModelProvider,
  ModelRequest,
  ModelResponse,
  QueryExecutionOptions,
  QueryPlan,
  QueryResult,
  RelationshipInfo,
  SqlDialect,
  SqlSafetyPolicy,
  SqlToolResult,
  TableInfo,
  TableSchema,
  ToolContext,
} from './core/types/index.js';

export { SchemaCache } from './schema/cache.js';
