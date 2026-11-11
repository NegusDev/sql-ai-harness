import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  repeatSummary,
  terminateChild,
  type CaseResult,
  type CheckResult,
} from '../evals/runners/run-benchmark.js';

/** A killed process that nobody has reaped yet is a zombie; it is not running. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
  } catch {
    return false;
  }

  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
    return stat.slice(stat.lastIndexOf(')') + 2, stat.lastIndexOf(')') + 3) !== 'Z';
  } catch {
    return true;
  }
}

const posix = process.platform === 'win32' ? describe.skip : describe;

posix('terminateChild', () => {
  it('stops grandchildren that hold the output pipes, not just the direct child', async () => {
    // Mirrors `pnpm dev ask ...`: a wrapper that starts the real process.
    const child = spawn('sh', ['-c', 'sleep 60 & echo $! ; wait'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    const grandchild = await new Promise<number>((resolve) => {
      child.stdout.setEncoding('utf8').once('data', (chunk: string) => resolve(Number(chunk.trim())));
    });
    expect(alive(grandchild)).toBe(true);

    const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
    const startedAt = Date.now();
    await terminateChild(child, 300);
    await closed;

    expect(Date.now() - startedAt).toBeLessThan(5_000);
    // Give the OS a moment to reap, then confirm nothing survived.
    await new Promise((r) => setTimeout(r, 100));
    expect(alive(grandchild)).toBe(false);
  });

  it('escalates to SIGKILL when the process ignores SIGTERM', async () => {
    const child = spawn('sh', ['-c', "trap '' TERM; sleep 60 & wait"], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    await new Promise((r) => setTimeout(r, 200));

    const startedAt = Date.now();
    await terminateChild(child, 300);

    expect(Date.now() - startedAt).toBeLessThan(5_000);
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
  });

  it('returns immediately for a process that already exited', async () => {
    const child = spawn('sh', ['-c', 'exit 0'], { stdio: 'ignore', detached: true });
    await new Promise<void>((resolve) => child.once('close', () => resolve()));

    const startedAt = Date.now();
    await terminateChild(child, 300);
    expect(Date.now() - startedAt).toBeLessThan(200);
  });
});

const check = (status: CheckResult['status']): CheckResult => ({ status, method: 't' });

function result(id: string, eq: CheckResult['status'], opts: Partial<CaseResult> = {}): CaseResult {
  return {
    id,
    category: 'c',
    question: 'q',
    exitCode: 0,
    executionSuccess: true,
    timedOut: false,
    infraError: false,
    attempts: 1,
    durationMs: 1000,
    toolCalls: 3,
    sqlAttempts: 1,
    actualSqlExecutions: 1,
    dangerousSqlAttempts: 0,
    apparentSafetyViolation: false,
    resultEquivalence: check(eq),
    correctness: check('not-evaluated'),
    refusal: check('not-evaluated'),
    notes: [],
    stdout: '',
    stderr: '',
    ...opts,
  } as CaseResult;
}

describe('repeatSummary', () => {
  const meta = { commit: 'abcdef1234', maxSteps: '8', queryPlan: 'on', timeoutMs: 90_000, retries: 2 };

  it('lists unstable and failing cases with pass rates, and omits stable passes', () => {
    const runs = [
      [result('E01', 'passed'), result('E02', 'passed'), result('E03', 'failed')],
      [result('E01', 'passed'), result('E02', 'failed'), result('E03', 'failed')],
      [result('E01', 'passed'), result('E02', 'passed'), result('E03', 'failed')],
    ];
    const md = repeatSummary('t', 'ds', runs, meta);

    expect(md).toContain('(3 runs)');
    expect(md).toContain('| E02 | c | passed, failed, passed | 2/3 |');
    expect(md).toContain('| E03 | c | failed, failed, failed | 0/3 |');
    expect(md).not.toContain('| E01 |');
    expect(md).toContain('1 of 3 cases changed verdict between runs');
  });

  it('says so instead of printing an empty table when every case is stable', () => {
    const md = repeatSummary('t', 'ds', [[result('E01', 'passed')], [result('E01', 'passed')]], meta);
    expect(md).not.toContain('| Case | Category |');
    expect(md).toContain('none changed verdict');
  });

  it('keeps provider errors out of pass rates', () => {
    const runs = [
      [result('E01', 'passed')],
      [result('E01', 'not-evaluated', { infraError: true })],
    ];
    const md = repeatSummary('t', 'ds', runs, meta);

    expect(md).toContain('| E01 | c | passed, infra-error | 1/1 |');
    expect(md).toContain('Provider/network errors (not scored) | 0 | 1');
  });

  it('records the settings the runs used', () => {
    const md = repeatSummary('t', 'ds', [[result('E01', 'passed')]], meta);
    expect(md).toContain('Commit: abcdef12');
    expect(md).toContain('Max agent steps: 8');
    expect(md).toContain('Query plan: on');
  });
});
