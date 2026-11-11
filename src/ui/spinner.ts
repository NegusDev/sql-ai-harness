import { visibleLength, type Style } from './style.js';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface SpinnerStream {
  isTTY?: boolean;
  columns?: number;
  write(chunk: string): unknown;
}

/**
 * A one-line progress indicator for interactive terminals. It does nothing on
 * pipes, so scripted use sees no control characters.
 */
export class Spinner {
  private timer?: NodeJS.Timeout;
  private frame = 0;
  private label = '';
  private startedAt = 0;
  private cursorHidden = false;
  private readonly onExit = (): void => this.stop();

  constructor(
    private readonly stream: SpinnerStream,
    private readonly style: Style,
  ) {}

  get active(): boolean {
    return Boolean(this.stream.isTTY) && this.style.rich;
  }

  start(label: string): void {
    if (!this.active) return;
    this.label = label;

    if (this.timer) return;

    this.startedAt = Date.now();
    this.stream.write('\u001b[?25l');
    this.cursorHidden = true;
    process.once('exit', this.onExit);
    this.timer = setInterval(() => this.render(), 80);
    this.timer.unref();
    this.render();
  }

  update(label: string): void {
    this.label = label;
    if (this.timer) this.render();
  }

  /** Erases the spinner line so other output can print cleanly. */
  clear(): void {
    if (this.timer) this.stream.write('\r\u001b[2K');
  }

  /** Redraws after other output. */
  resume(): void {
    if (this.timer) this.render();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      this.stream.write('\r\u001b[2K');
    }

    if (this.cursorHidden) {
      this.stream.write('\u001b[?25h');
      this.cursorHidden = false;
    }

    process.removeListener('exit', this.onExit);
  }

  private render(): void {
    const seconds = Math.floor((Date.now() - this.startedAt) / 1000);
    const elapsed = seconds >= 1 ? ` ${this.style.dim(`${seconds}s`)}` : '';
    const columns = typeof this.stream.columns === 'number' ? this.stream.columns : 80;
    const room = Math.max(10, columns - 6);
    const label =
      visibleLength(this.label) > room ? `${this.label.slice(0, room - 1)}…` : this.label;

    this.frame = (this.frame + 1) % FRAMES.length;
    this.stream.write(`\r\u001b[2K${this.style.cyan(FRAMES[this.frame] ?? '⠋')} ${label}${elapsed}`);
  }
}
