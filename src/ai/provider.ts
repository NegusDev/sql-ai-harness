import type { ToolSet } from 'ai';
import type { ModelProvider, ModelRequest, ModelResponse } from '../core/types/index.js';

export type { ModelProvider, ModelRequest, ModelResponse };

export interface AiProvider extends ModelProvider {
  generate(request: ModelRequest & { tools?: ToolSet; maxSteps?: number }): Promise<ModelResponse & {
    steps?: number;
    toolCalls?: number;
  }>;
}
