import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { hashEmail, hashName, hashPhone, normalizeEmail, normalizePhoneBR } from '../hash-pii.js';

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });
  it('rejects missing @', () => {
    expect(normalizeEmail('notanemail')).toBeNull();
  });
  it('rejects empty', () => {
    expect(normalizeEmail('')).toBeNull();
  });
});

describe('normalizePhoneBR', () => {
  it('strips non-digits and prefixes 55 for 11-digit mobile', () => {
    expect(normalizePhoneBR('(11) 98765-4321')).toBe('5511987654321');
  });
  it('prefixes 55 for 10-digit landline', () => {
    expect(normalizePhoneBR('1134567890')).toBe('551134567890');
  });
  it('preserves existing 55 prefix', () => {
    expect(normalizePhoneBR('+55 11 98765-4321')).toBe('5511987654321');
  });
  it('returns null for empty', () => {
    expect(normalizePhoneBR('')).toBeNull();
  });
});

describe('hashEmail / hashPhone / hashName', () => {
  it('hashes normalized email', () => {
    expect(hashEmail('Foo@Bar.com')).toBe(sha('foo@bar.com'));
  });
  it('hashes normalized BR phone', () => {
    expect(hashPhone('(11) 98765-4321')).toBe(sha('5511987654321'));
  });
  it('hashes lowercased name', () => {
    expect(hashName('  JOÃO ')).toBe(sha('joão'));
  });
  it('returns null for invalid inputs', () => {
    expect(hashEmail('nope')).toBeNull();
    expect(hashPhone('')).toBeNull();
    expect(hashName('')).toBeNull();
  });
});
