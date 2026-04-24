import { describe, it, expect, afterAll } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderCreativeTable, writeReport } from '../html-report.js';

const TMP = join(tmpdir(), `adskills-reports-${Date.now()}`);

describe('html-report', () => {
  afterAll(async () => {
    await rm(TMP, { recursive: true, force: true });
  });

  it('escapes HTML in creative table', () => {
    const html = renderCreativeTable([
      {
        name: '<script>alert(1)</script>',
        file: '/evil&.jpg',
        sizeKb: 100,
        status: 'ok',
      },
    ]);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('evil&amp;.jpg');
  });

  it('writeReport creates file with title and sections', async () => {
    const path = await writeReport(
      {
        title: 'Test <title>',
        platform: 'meta',
        skill: 'creative-strategy',
        sections: [{ heading: 'Sec', html: '<p>hello</p>' }],
      },
      TMP,
    );
    expect(path).toContain('meta-ads/creative-strategy');
    const content = await readFile(path, 'utf8');
    expect(content).toContain('Test &lt;title&gt;');
    expect(content).toContain('<p>hello</p>');
    expect(content).toContain('cdn.tailwindcss.com');
    expect(content).toContain('chart.js');
  });
});
