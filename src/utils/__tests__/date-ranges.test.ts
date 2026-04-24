import { describe, it, expect } from 'vitest';
import { lastNDays, previousWindow, monthToDate, daysInMonth } from '../date-ranges.js';

describe('lastNDays', () => {
  it('returns N-day window ending yesterday (UTC)', () => {
    const anchor = new Date('2026-04-24T00:00:00Z');
    const r = lastNDays(7, anchor);
    expect(r.until).toBe('2026-04-23');
    expect(r.since).toBe('2026-04-17');
  });

  it('handles 1-day window', () => {
    const anchor = new Date('2026-04-24T00:00:00Z');
    const r = lastNDays(1, anchor);
    expect(r.since).toBe('2026-04-23');
    expect(r.until).toBe('2026-04-23');
  });
});

describe('previousWindow', () => {
  it('returns the preceding equal-length window', () => {
    const cur = { since: '2026-04-17', until: '2026-04-23' };
    const prev = previousWindow(cur);
    expect(prev).toEqual({ since: '2026-04-10', until: '2026-04-16' });
  });
});

describe('monthToDate', () => {
  it('starts at first day of month, ends yesterday', () => {
    const anchor = new Date('2026-04-24T00:00:00Z');
    const r = monthToDate(anchor);
    expect(r.since).toBe('2026-04-01');
    expect(r.until).toBe('2026-04-23');
  });

  it('handles first-of-month anchor', () => {
    const anchor = new Date('2026-05-01T00:00:00Z');
    const r = monthToDate(anchor);
    expect(r.since).toBe('2026-05-01');
    expect(r.until).toBe('2026-05-01');
  });
});

describe('daysInMonth', () => {
  it('returns 30 for April', () => {
    expect(daysInMonth(2026, 3)).toBe(30);
  });
  it('returns 29 for Feb in leap year', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });
  it('returns 28 for Feb in non-leap', () => {
    expect(daysInMonth(2025, 1)).toBe(28);
  });
});
