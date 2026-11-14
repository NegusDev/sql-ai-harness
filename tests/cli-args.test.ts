import { describe, expect, it } from 'vitest';
import { parseCli } from '../src/cli-args.js';

describe('parseCli', () => {
  it('asks a question without the ask subcommand', () => {
    expect(parseCli(['Who owes us money?'])).toEqual({ kind: 'ask', mode: 'natural', question: 'Who owes us money?' });
  });

  it('joins unquoted words into one question', () => {
    expect(parseCli(['how', 'many', 'clients'])).toEqual({ kind: 'ask', mode: 'natural', question: 'how many clients' });
  });

  it('keeps the ask subcommand working with the same result', () => {
    expect(parseCli(['ask', 'how many clients'])).toEqual(parseCli(['how many clients']));
    expect(parseCli(['ask', '--mode', 'technical', 'q?'])).toEqual({ kind: 'ask', mode: 'technical', question: 'q?' });
  });

  it('accepts mode options before or after the question', () => {
    const expected = { kind: 'ask', mode: 'debug', question: 'how many clients' };
    expect(parseCli(['--debug', 'how many clients'])).toEqual(expected);
    expect(parseCli(['how many clients', '--mode', 'debug'])).toEqual(expected);
    expect(parseCli(['--mode=debug', 'how many clients'])).toEqual(expected);
    expect(parseCli(['--technical', 'how many clients'])).toMatchObject({ mode: 'technical' });
  });

  it('rejects an invalid mode', () => {
    expect(parseCli(['--mode', 'loud', 'q?'])).toMatchObject({ kind: 'error', message: expect.stringContaining('Invalid response mode') });
    expect(parseCli(['--mode'])).toMatchObject({ kind: 'error' });
  });

  it('does not send a mistyped option to the model', () => {
    expect(parseCli(['--mod', 'debug', 'how many clients'])).toMatchObject({
      kind: 'error',
      message: 'Unknown option: --mod',
      showUsage: true,
    });
    expect(parseCli(['ask', '-x', 'how many clients'])).toMatchObject({ kind: 'error' });
  });

  it('treats a lone word as a mistyped command, with the escape hatch', () => {
    expect(parseCli(['valdiate'])).toMatchObject({
      kind: 'error',
      message: expect.stringContaining('dbask ask valdiate'),
    });
  });

  it('still accepts a one-word question with a question mark or via ask', () => {
    expect(parseCli(['revenue?'])).toMatchObject({ kind: 'ask', question: 'revenue?' });
    expect(parseCli(['ask', 'revenue'])).toMatchObject({ kind: 'ask', question: 'revenue' });
  });

  it('uses -- to allow a question that starts with a dash', () => {
    expect(parseCli(['--', '--help me understand clients'])).toMatchObject({
      kind: 'ask',
      question: '--help me understand clients',
    });
  });

  it('requires a question', () => {
    expect(parseCli(['ask'])).toMatchObject({ kind: 'error', message: 'a question is required.' });
    expect(parseCli(['--debug'])).toMatchObject({ kind: 'error' });
  });

  it('routes init, validate, help and version', () => {
    expect(parseCli(['init', '--force'])).toEqual({ kind: 'init', args: ['--force'] });
    expect(parseCli(['validate', '--skip-provider'])).toEqual({ kind: 'validate', args: ['--skip-provider'] });
    expect(parseCli([])).toEqual({ kind: 'help' });
    for (const flag of ['--help', '-h', 'help']) expect(parseCli([flag])).toEqual({ kind: 'help' });
    for (const flag of ['--version', '-v']) expect(parseCli([flag])).toEqual({ kind: 'version' });
    expect(parseCli(['ask', '--help'])).toEqual({ kind: 'help' });
  });
});
