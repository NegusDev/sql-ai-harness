import { describe, expect, it } from 'vitest';
import * as sdk from '../src/index.js';

describe('public SDK entry point', () => {
  it('exports the supported agent, provider, database and configuration APIs', () => {
    expect(sdk.Agent).toBeDefined();
    expect(sdk.SdkAiProvider).toBeDefined();
    expect(sdk.createAiProvider).toBeTypeOf('function');
    expect(sdk.loadConfig).toBeTypeOf('function');
    expect(sdk.MySqlAdapter).toBeDefined();
    expect(sdk.SchemaCache).toBeDefined();
  });
});
