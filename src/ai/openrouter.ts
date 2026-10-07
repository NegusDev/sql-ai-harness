import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, isStepCount, type ToolSet } from 'ai';
import type { AppConfig } from '../config/config.js';
import type { ModelRequest, ModelResponse } from '../core/types/index.js';
import type { AiProvider } from './provider.js';

export class OpenRouterProvider implements AiProvider {
  readonly name = 'openrouter';

  private readonly provider: ReturnType<typeof createOpenRouter>;
  private readonly model: string;

  constructor(config: AppConfig['ai']) {
    this.model = config.model;
    this.provider = createOpenRouter({
      apiKey: config.apiKey,
      ...(config.siteUrl ? { appUrl: config.siteUrl } : {}),
      ...(config.siteName ? { appName: config.siteName } : {}),
    });
  }

  async generate(request: ModelRequest & { tools?: ToolSet; maxSteps?: number }): Promise<ModelResponse> {
    const result = await generateText({
      model: this.provider.chat(this.model),
      system: request.system,
      prompt: request.prompt,
      tools: request.tools,
      stopWhen: request.maxSteps ? isStepCount(request.maxSteps) : undefined,
      temperature: request.temperature,
    });

    const toolCalls = result.steps?.reduce((count, step) => count + (step.toolCalls?.length ?? 0), 0) ?? 0;

    return {
      text: result.text,
      raw: result,
      steps: result.steps?.length ?? 1,
      toolCalls,
    };
  }
}
