import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsv } from '../csv-parser.js';

const TMP = join(tmpdir(), `adskills-test-${Date.now()}.csv`);

async function writeFixture(content: string) {
  await writeFile(TMP, content, 'utf8');
}

describe('parseCsv', () => {
  afterAll(async () => {
    try { await unlink(TMP); } catch { /* noop */ }
  });

  it('parses headers + rows with commas', async () => {
    await writeFixture('email,name\nfoo@bar.com,Foo\nbaz@qux.com,Baz\n');
    const rows = await parseCsv(TMP);
    expect(rows).toEqual([
      { email: 'foo@bar.com', name: 'Foo' },
      { email: 'baz@qux.com', name: 'Baz' },
    ]);
  });

  it('handles semicolons as delimiters', async () => {
    await writeFixture('email;name\nfoo@bar.com;Foo\n');
    const rows = await parseCsv(TMP);
    expect(rows).toEqual([{ email: 'foo@bar.com', name: 'Foo' }]);
  });

  it('handles quoted fields containing commas', async () => {
    await writeFixture('email,name\n"foo@bar.com","Doe, Jane"\n');
    const rows = await parseCsv(TMP);
    expect(rows[0]).toEqual({ email: 'foo@bar.com', name: 'Doe, Jane' });
  });

  it('unescapes doubled quotes inside quoted fields', async () => {
    await writeFixture('name\n"She said ""hi"""\n');
    const rows = await parseCsv(TMP);
    expect(rows[0]!.name).toBe('She said "hi"');
  });

  it('returns empty for empty file', async () => {
    await writeFixture('');
    const rows = await parseCsv(TMP);
    expect(rows).toEqual([]);
  });
});
