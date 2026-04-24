import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { MetaClient } from '../clients/meta.js';
import { getToken } from '../core/auth.js';
import { lastNDays, previousWindow } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface MetaFatigueOptions {
  accountRef: string;
  adSetId?: string;
  ctrDropPct: number;
  frequencyCap: number;
  lookbackDays: number;
  password: string;
  configPath: string;
  thresholdsPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: { meta?: { adAccountId: string; tokenRef: string } };
}

interface AdFatigue {
  adId: string;
  name: string;
  status: string;
  current: { ctr: number; frequency: number; impressions: number; spend: number };
  previous: { ctr: number; frequency: number };
  ctrDelta: number;
  flags: string[];
}

export async function runMetaFatigue(opts: MetaFatigueOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.meta) throw new Error(`Account "${opts.accountRef}" missing meta config`);

  const token = await getToken(account.meta.tokenRef, opts.password);
  if (!token) throw new Error(`No token for ${account.meta.tokenRef}`);

  const client = new MetaClient({
    accessToken: token.accessToken,
    adAccountId: account.meta.adAccountId,
  });

  const current = lastNDays(opts.lookbackDays);
  const previous = previousWindow(current);

  const ads = await client.listAds(opts.adSetId);
  console.log(kleur.cyan(`\nAnalyzing ${ads.length} ads · window ${current.since}→${current.until} vs ${previous.since}→${previous.until}`));

  const results: AdFatigue[] = [];
  const spinner = ora('Fetching insights').start();
  let done = 0;

  for (const ad of ads) {
    try {
      const [curr, prev] = await Promise.all([
        client.getInsights(ad.id, current, 'ad'),
        client.getInsights(ad.id, previous, 'ad'),
      ]);
      const c = curr[0] ?? { ctr: 0, frequency: 0, impressions: 0, spend: 0, clicks: 0, cpc: 0, cpm: 0 };
      const p = prev[0] ?? { ctr: 0, frequency: 0, impressions: 0, spend: 0, clicks: 0, cpc: 0, cpm: 0 };
      const ctrDelta = p.ctr > 0 ? ((c.ctr - p.ctr) / p.ctr) * 100 : 0;
      const flags: string[] = [];
      if (ctrDelta <= -opts.ctrDropPct) flags.push(`CTR ↓ ${ctrDelta.toFixed(1)}%`);
      if ((c.frequency ?? 0) >= opts.frequencyCap) flags.push(`freq ${(c.frequency ?? 0).toFixed(2)} ≥ ${opts.frequencyCap}`);
      if (flags.length > 0) {
        results.push({
          adId: ad.id,
          name: ad.name,
          status: ad.status,
          current: { ctr: c.ctr, frequency: c.frequency ?? 0, impressions: c.impressions, spend: c.spend },
          previous: { ctr: p.ctr, frequency: p.frequency ?? 0 },
          ctrDelta,
          flags,
        });
      }
      done++;
      spinner.text = `Fetching insights (${done}/${ads.length})`;
    } catch (err) {
      // ad with no impressions returns error on some endpoints; skip
      done++;
    }
  }
  spinner.succeed(`Analyzed ${ads.length} ads · ${results.length} flagged`);

  results.sort((a, b) => a.ctrDelta - b.ctrDelta);

  const tableHtml = `<table>
    <thead><tr><th>Ad</th><th>Status</th><th>CTR now</th><th>CTR prev</th><th>Δ</th><th>Freq</th><th>Spend</th><th>Flags</th></tr></thead>
    <tbody>${results
      .map(
        (r) => `<tr>
          <td><code>${r.adId}</code> ${escapeHtml(r.name)}</td>
          <td>${r.status}</td>
          <td>${r.current.ctr.toFixed(2)}%</td>
          <td class="text-slate-400">${r.previous.ctr.toFixed(2)}%</td>
          <td class="${r.ctrDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}">${r.ctrDelta.toFixed(1)}%</td>
          <td>${r.current.frequency.toFixed(2)}</td>
          <td>$${r.current.spend.toFixed(2)}</td>
          <td>${r.flags.map((f) => `<span class="text-rose-300">${escapeHtml(f)}</span>`).join('<br/>')}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const summaryHtml = `<div class="grid grid-cols-3 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Ads analyzed</div><div class="text-2xl font-bold mt-1">${ads.length}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Fatigued</div><div class="text-2xl font-bold mt-1 text-rose-300">${results.length}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Thresholds</div><div class="mt-1 text-sm">CTR drop ≥ ${opts.ctrDropPct}% · freq ≥ ${opts.frequencyCap}</div></div>
  </div>`;

  const htmlPath = await writeReport(
    {
      title: 'Meta Ads — Creative Fatigue Scan',
      subtitle: `${results.length} ads flagged over ${opts.lookbackDays}d`,
      platform: 'meta',
      skill: 'fatigue-monitor',
      accountRef: opts.accountRef,
      period: current,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Flagged ads (sorted by worst CTR drop)', html: tableHtml },
      ],
    },
    opts.reportsDir,
  );

  const mdPath = await writeMarkdownReport(
    {
      title: 'Meta Ads — Fatigue Scan',
      platform: 'meta',
      skill: 'fatigue-monitor',
      summary: `**${results.length}** / ${ads.length} ads flagged · window ${current.since}→${current.until}`,
      table: {
        headers: ['Ad', 'CTR Δ', 'Freq', 'Spend', 'Flags'],
        rows: results.map((r) => [
          r.name,
          `${r.ctrDelta.toFixed(1)}%`,
          r.current.frequency.toFixed(2),
          `$${r.current.spend.toFixed(2)}`,
          r.flags.join('; '),
        ]),
      },
      notes: [
        `Thresholds: CTR drop ≥ ${opts.ctrDropPct}%, frequency ≥ ${opts.frequencyCap}`,
        `No ads were paused automatically — use 'adskills meta pause --ad <id>' after review (Phase 2+).`,
      ],
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${results.length} flagged`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
