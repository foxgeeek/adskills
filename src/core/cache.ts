import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { CONFIG_DIR } from './paths.js';

const CACHE_DIR = join(CONFIG_DIR, 'cache');

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const path = join(CACHE_DIR, `${key}.json`);
  try {
    const raw = await readFile(path, 'utf8');
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.expiresAt && entry.expiresAt < Date.now()) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const path = join(CACHE_DIR, `${key}.json`);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  await writeFile(path, JSON.stringify(entry), { mode: 0o600 });
}
