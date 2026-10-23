
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createCerebras } from '@ai-sdk/cerebras';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import type { AppConfig } from '../config/config.js';
import type { AiProvider } from './provider.js';
import { SdkAiProvider } from './sdk-provider.js';

export function createAiProvider(config: AppConfig['ai']): AiProvider {
  switch (config.provider) {
    case 'openrouter': {
      const provider = createOpenRouter({
        apiKey: config.apiKey!,
        ...(config.siteUrl ? { appUrl: config.siteUrl } : {}),
        ...(config.siteName ? { appName: config.siteName } : {}),
      });

      return new SdkAiProvider(
        'openrouter',
        provider.chat(config.model),
      );
    }

    case 'groq': {
      const provider = createGroq({
        apiKey: config.apiKey!,
      });

      return new SdkAiProvider('groq', provider(config.model));
    }

    case 'google': {
      const provider = createGoogleGenerativeAI({
        apiKey: config.apiKey!,
      });

      return new SdkAiProvider('google', provider(config.model));
    }

    case 'cerebras': {
      const provider = createCerebras({
        apiKey: config.apiKey!,
      });

      return new SdkAiProvider('cerebras', provider(config.model));
    }

    case 'ollama': {
      const provider = createOpenAICompatible({
        name: 'ollama',
        baseURL: config.baseUrl ?? 'http://localhost:11434/v1',
      });

      return new SdkAiProvider(
        'ollama',
        provider.chatModel(config.model),
      );
    }

    default: {
      const exhaustiveCheck: never = config.provider;
      throw new Error(`Unsupported AI provider: ${exhaustiveCheck}`);
    }
  }
}
