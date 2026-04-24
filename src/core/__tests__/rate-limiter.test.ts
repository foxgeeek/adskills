import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../rate-limiter.js';

describe('RateLimiter', () => {
  it('respects maxConcurrent', async () => {
    const limiter = new RateLimiter({ maxConcurrent: 2, minIntervalMs: 0 });
    let active = 0;
    let peak = 0;
    const task = async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 20));
      active--;
    };
    await Promise.all(Array.from({ length: 6 }, () => limiter.run(task)));
    expect(peak).toBeLessThanOrEqual(2);
  });

  it('returns the result of the wrapped fn', async () => {
    const limiter = new RateLimiter({ maxConcurrent: 1, minIntervalMs: 0 });
    const out = await limiter.run(async () => 42);
    expect(out).toBe(42);
  });

  it('propagates errors', async () => {
    const limiter = new RateLimiter({ maxConcurrent: 1, minIntervalMs: 0 });
    await expect(limiter.run(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
  });

  it('enforces minIntervalMs between starts', async () => {
    const limiter = new RateLimiter({ maxConcurrent: 1, minIntervalMs: 50 });
    const starts: number[] = [];
    const task = async () => { starts.push(Date.now()); };
    await Promise.all(Array.from({ length: 3 }, () => limiter.run(task)));
    const gap1 = starts[1]! - starts[0]!;
    const gap2 = starts[2]! - starts[1]!;
    expect(gap1).toBeGreaterThanOrEqual(40);
    expect(gap2).toBeGreaterThanOrEqual(40);
  });
});
