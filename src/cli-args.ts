import type { ResponseMode } from './core/agent/agent.js';

export type CliCommand =
  | { kind: 'help' }
  | { kind: 'version' }
  | { kind: 'init'; args: string[] }
  | { kind: 'validate'; args: string[] }
  | { kind: 'ask'; mode: ResponseMode; question: string }
  | { kind: 'error'; message: string; showUsage?: boolean };

const MODES: ResponseMode[] = ['natural', 'technical', 'debug'];
const OPTION_LIKE = /^--?[A-Za-z]/;

function parseAsk(args: string[], implicit: boolean): CliCommand {
  let mode: ResponseMode = 'natural';
  const words: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? '';

    if (arg === '--') {
      words.push(...args.slice(i + 1));
      break;
    }

    if (arg === '--help' || arg === '-h') return { kind: 'help' };

    if (arg === '--mode' || arg.startsWith('--mode=')) {
      const value = arg === '--mode' ? args[++i] : arg.slice('--mode='.length);
      if (!MODES.includes(value as ResponseMode)) {
        return { kind: 'error', message: 'Invalid response mode. Use natural, technical, or debug.' };
      }
      mode = value as ResponseMode;
      continue;
    }

    if (arg === '--technical') {
      mode = 'technical';
      continue;
    }

    if (arg === '--debug') {
      mode = 'debug';
      continue;
    }

    // A mistyped option must not be sent to the model as part of the question.
    if (OPTION_LIKE.test(arg)) {
      return { kind: 'error', message: `Unknown option: ${arg}`, showUsage: true };
    }

    words.push(arg);
  }

  const question = words.join(' ').trim();

  if (!question) {
    return { kind: 'error', message: 'a question is required.', showUsage: implicit };
  }

  // `dbask valdiate` is far more likely a mistyped command than a one-word
  // question, and sending it to the model would cost a request. A question mark
  // or a second word makes it a question; `dbask ask <word>` always works.
  if (implicit && words.length === 1 && !/\s/.test(question) && !question.includes('?')) {
    return {
      kind: 'error',
      message: `Unknown command: ${question}. To ask a one-word question, use: dbask ask ${question}`,
      showUsage: true,
    };
  }

  return { kind: 'ask', mode, question };
}

/**
 * Parses `dbask <command>` and the shorthand `dbask "your question"`.
 * `ask` still works, so existing scripts keep running.
 */
export function parseCli(argv: string[]): CliCommand {
  const [first, ...rest] = argv;

  if (first === undefined) return { kind: 'help' };
  if (first === 'help' || first === '--help' || first === '-h') return { kind: 'help' };
  if (first === '--version' || first === '-v') return { kind: 'version' };
  if (first === 'init') return { kind: 'init', args: rest };
  if (first === 'validate') return { kind: 'validate', args: rest };
  if (first === 'ask') return parseAsk(rest, false);

  return parseAsk(argv, true);
}
