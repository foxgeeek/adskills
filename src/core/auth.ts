import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt as scryptCb,
} from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import { promisify } from 'node:util';
import { ensureConfigDir, SALT_PATH, TOKENS_PATH } from './paths.js';
import { logger } from './logger.js';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;

export type Platform = 'meta' | 'google' | 'linkedin';

export interface StoredToken {
  platform: Platform;
  accountRef: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  createdAt: number;
}

export interface TokenStore {
  [tokenRef: string]: StoredToken;
}

interface EncryptedBlob {
  version: 1;
  iv: string;
  authTag: string;
  ciphertext: string;
}

async function getSalt(): Promise<Buffer> {
  try {
    await access(SALT_PATH);
    return await readFile(SALT_PATH);
  } catch {
    const salt = randomBytes(16);
    await ensureConfigDir();
    await writeFile(SALT_PATH, salt, { mode: 0o600 });
    return salt;
  }
}

async function deriveKey(password: string): Promise<Buffer> {
  const salt = await getSalt();
  return scrypt(password, salt, KEY_LEN);
}

function encrypt(plaintext: string, key: Buffer): EncryptedBlob {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

function decrypt(blob: EncryptedBlob, key: Buffer): string {
  const decipher = createDecipheriv(ALGO, key, Buffer.from(blob.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(blob.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export async function loadTokenStore(password: string): Promise<TokenStore> {
  try {
    await access(TOKENS_PATH);
  } catch {
    return {};
  }
  const raw = await readFile(TOKENS_PATH, 'utf8');
  const blob = JSON.parse(raw) as EncryptedBlob;
  const key = await deriveKey(password);
  try {
    const plaintext = decrypt(blob, key);
    return JSON.parse(plaintext) as TokenStore;
  } catch (err) {
    logger.error('Failed to decrypt token store — wrong password or corrupted file');
    throw err;
  }
}

export async function saveTokenStore(store: TokenStore, password: string): Promise<void> {
  await ensureConfigDir();
  const key = await deriveKey(password);
  const blob = encrypt(JSON.stringify(store), key);
  await writeFile(TOKENS_PATH, JSON.stringify(blob, null, 2), { mode: 0o600 });
}

export async function putToken(
  token: StoredToken,
  password: string,
): Promise<void> {
  const store = await loadTokenStore(password);
  store[`${token.platform}.${token.accountRef}`] = token;
  await saveTokenStore(store, password);
}

export async function getToken(
  tokenRef: string,
  password: string,
): Promise<StoredToken | null> {
  const store = await loadTokenStore(password);
  return store[tokenRef] ?? null;
}
