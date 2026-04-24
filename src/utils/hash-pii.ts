import { createHash } from 'node:crypto';

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

export function normalizeEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizePhoneBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function hashEmail(raw: string): string | null {
  const normalized = normalizeEmail(raw);
  return normalized ? sha256(normalized) : null;
}

export function hashPhone(raw: string): string | null {
  const normalized = normalizePhoneBR(raw);
  return normalized ? sha256(normalized) : null;
}

export function hashName(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  return sha256(trimmed);
}
