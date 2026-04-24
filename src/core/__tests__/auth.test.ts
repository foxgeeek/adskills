import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';

const fakeHome = join(tmpdir(), `adskills-auth-${Date.now()}`);

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => fakeHome };
});

// Import after mock
const { loadTokenStore, saveTokenStore, putToken, getToken } = await import('../auth.js');

describe('token store (AES-256-GCM)', () => {
  beforeEach(async () => {
    await rm(fakeHome, { recursive: true, force: true });
  });
  afterEach(async () => {
    await rm(fakeHome, { recursive: true, force: true });
  });

  it('roundtrips a token through encrypt/decrypt', async () => {
    const password = 'correct horse battery staple';
    await putToken(
      {
        platform: 'meta',
        accountRef: 'acme',
        accessToken: 'tok-123',
        createdAt: Date.now(),
      },
      password,
    );
    const got = await getToken('meta.acme', password);
    expect(got?.accessToken).toBe('tok-123');
  });

  it('returns empty store when file does not exist', async () => {
    const store = await loadTokenStore('anything');
    expect(store).toEqual({});
  });

  it('throws on wrong password', async () => {
    await saveTokenStore({ 'meta.x': { platform: 'meta', accountRef: 'x', accessToken: 't', createdAt: 0 } }, 'right');
    await expect(loadTokenStore('wrong')).rejects.toBeTruthy();
  });

  it('preserves multiple tokens', async () => {
    const password = 'pw';
    await putToken({ platform: 'meta', accountRef: 'a', accessToken: 'A', createdAt: 1 }, password);
    await putToken({ platform: 'google', accountRef: 'a', accessToken: 'G', refreshToken: 'R', createdAt: 2 }, password);
    expect((await getToken('meta.a', password))?.accessToken).toBe('A');
    expect((await getToken('google.a', password))?.refreshToken).toBe('R');
  });
});
