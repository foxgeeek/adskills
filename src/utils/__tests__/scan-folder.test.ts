import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanCreativeFolder } from '../scan-folder.js';

const DIR = join(tmpdir(), `adskills-scan-${Date.now()}`);

describe('scanCreativeFolder', () => {
  beforeAll(async () => {
    await mkdir(DIR, { recursive: true });
    await writeFile(join(DIR, 'a.jpg'), Buffer.from([0xff]));
    await writeFile(join(DIR, 'b.PNG'), Buffer.from([0xff]));
    await writeFile(join(DIR, 'c.mp4'), Buffer.from([0xff]));
    await writeFile(join(DIR, 'ignore.txt'), 'nope');
    await writeFile(join(DIR, 'ignore.gif'), Buffer.from([0xff]));
  });
  afterAll(async () => {
    await rm(DIR, { recursive: true, force: true });
  });

  it('returns only supported mimes and sorts by path', async () => {
    const assets = await scanCreativeFolder(DIR);
    expect(assets.map((a) => a.name)).toEqual(['a', 'b', 'c']);
    expect(assets.map((a) => a.mimeType)).toEqual(['image/jpeg', 'image/png', 'video/mp4']);
  });

  it('skips unsupported extensions', async () => {
    const assets = await scanCreativeFolder(DIR);
    expect(assets.some((a) => a.name.startsWith('ignore'))).toBe(false);
  });
});
