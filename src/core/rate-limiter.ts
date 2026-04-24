export interface RateLimiterOptions {
  maxConcurrent: number;
  minIntervalMs: number;
}

export class RateLimiter {
  private queue: Array<() => void> = [];
  private active = 0;
  private lastRun = 0;

  constructor(private readonly opts: RateLimiterOptions) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryStart = () => {
        const now = Date.now();
        const wait = Math.max(0, this.opts.minIntervalMs - (now - this.lastRun));
        if (this.active < this.opts.maxConcurrent && wait === 0) {
          this.active++;
          this.lastRun = Date.now();
          resolve();
        } else {
          setTimeout(tryStart, wait || 10);
        }
      };
      if (this.active >= this.opts.maxConcurrent) {
        this.queue.push(tryStart);
      } else {
        tryStart();
      }
    });
  }

  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}
