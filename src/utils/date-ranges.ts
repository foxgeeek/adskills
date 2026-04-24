import type { DateRange } from '../clients/types.js';

function formatISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function lastNDays(n: number, endDate: Date = new Date()): DateRange {
  const end = new Date(endDate);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (n - 1));
  return { since: formatISO(start), until: formatISO(end) };
}

export function previousWindow(range: DateRange): DateRange {
  const start = new Date(range.since);
  const end = new Date(range.until);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(start.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - (days - 1));
  return { since: formatISO(prevStart), until: formatISO(prevEnd) };
}

export function daysInMonth(year: number, monthIdx: number): number {
  return new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
}

export function monthToDate(date: Date = new Date()): DateRange {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() - 1);
  if (end < start) return { since: formatISO(start), until: formatISO(start) };
  return { since: formatISO(start), until: formatISO(end) };
}
