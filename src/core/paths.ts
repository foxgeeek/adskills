import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

export const CONFIG_DIR = join(homedir(), '.adskills');
export const TOKENS_PATH = join(CONFIG_DIR, 'tokens.json');
export const SALT_PATH = join(CONFIG_DIR, 'salt.bin');

export async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
}
