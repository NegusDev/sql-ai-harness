
import {
  generateText,
  isStepCount,
  type LanguageModel,
  type ToolSet,
} from 'ai';

import type { ModelRequest, ModelResponse } from '../core/types/index.js';
import type { AiProvider } from './provider.js';

export class SdkAiProvider implements AiProvider {
  constructor(
    readonly name: string,
    private readonly model: LanguageModel,
  ) {}

  async generate(
    request: ModelRequest & {
      tools?: ToolSet;
      maxSteps?: number;
    },
  ): Promise<ModelResponse> {
    const result = await generateText({
      model: this.model,
      system: request.system,
      prompt: request.prompt,
      tools: request.tools,
      stopWhen: request.maxSteps
        ? isStepCount(request.maxSteps)
        : undefined,
      // Reserve the last step for the answer: without this the model can spend
      // every step on tool calls and end with no text at all.
      prepareStep: request.maxSteps
        ? ({ stepNumber }) =>
            stepNumber >= (request.maxSteps as number) - 1
              ? { toolChoice: 'none' as const }
              : undefined
        : undefined,
      temperature: request.temperature,
    });

    const toolCalls = result.steps.reduce(
      (count, step) => count + (step.toolCalls?.length ?? 0),
      0,
    );

    return {
      text: result.text,
      raw: result,
      steps: result.steps.length,
      toolCalls,
    };
  }
}
