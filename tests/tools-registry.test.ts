import { describe, expect, it } from 'vitest';
import { getTool, getTools } from '../src/core/tools/registry.js';

describe('tool registry', () => {
  it('registers the initial database tools', () => {
    expect(getTools().map((tool) => tool.name)).toEqual([
      'list_tables',
      'describe_table',
      'describe_tables',
      'get_relationships',
      'execute_query',
      'explain_query',
    ]);
  });

  it('returns a registered tool by name', () => {
    expect(getTool('list_tables').description).toContain('List the tables');
  });
});
