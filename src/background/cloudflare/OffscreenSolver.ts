import { createDeferred } from './deferred';

export interface OffscreenSolverDeps {
  isAvailable(): boolean;
  hasDocument(): Promise<boolean>;
  createDocument(): Promise<void>;
  closeDocument(): Promise<void>;
}

const DEFAULT_OFFSCREEN_TIMEOUT_MS = 5000;

interface Attempt {
  promise: Promise<boolean>;
  resolve: (solved: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
  settled: boolean;
}

/**
 * Runs one hidden Turnstile attempt in an offscreen document.
 *
 * Resolves true only when the offscreen page reports a token. Any failure,
 * unsupported browser, or timeout resolves false so the caller can show the
 * visible fallback. The document is always closed before the promise settles.
 */
export class OffscreenSolver {
  private current: Attempt | null = null;

  constructor(
    private readonly deps: OffscreenSolverDeps,
    private readonly timeoutMs = DEFAULT_OFFSCREEN_TIMEOUT_MS,
  ) {}

  attempt(): Promise<boolean> {
    if (this.current) {
      return this.current.promise;
    }
    if (!this.deps.isAvailable()) {
      return Promise.resolve(false);
    }

    const { promise, resolve } = createDeferred<boolean>();
    const attempt: Attempt = {
      promise,
      resolve,
      settled: false,
      timer: setTimeout(() => this.settle(false), this.timeoutMs),
    };
    this.current = attempt;

    void (async () => {
      try {
        if (await this.deps.hasDocument()) {
          await this.deps.closeDocument();
        }
        await this.deps.createDocument();
        if (attempt.settled) {
          // The attempt timed out while the document was being created.
          await this.deps.closeDocument();
        }
      } catch {
        this.settle(false);
      }
    })();

    return promise;
  }

  markSolved(): void {
    this.settle(true);
  }

  markFailed(): void {
    this.settle(false);
  }

  private settle(solved: boolean): void {
    const attempt = this.current;
    if (!attempt || attempt.settled) {
      return;
    }
    attempt.settled = true;
    this.current = null;
    clearTimeout(attempt.timer);
    void this.deps.closeDocument().catch(() => {
      /* The document may already be gone after a failed create. */
    });
    attempt.resolve(solved);
  }
}
