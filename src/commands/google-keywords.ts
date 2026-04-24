import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { GoogleAdsClient } from '../clients/google.js';
import { getToken } from '../core/auth.js';
import { lastNDays } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface GoogleKeywordsOptions {
  accountRef: string;
  campaignId?: string;
  lookbackDays: number;
  password: string;
  configPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: { google?: { customerId: string; loginCustomerId?: string; tokenRef: string } };
}

export async function runGoogleKeywords(opts: GoogleKeywordsOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.google) throw new Error(`Account "${opts.accountRef}" missing google config`);
  const token = await getToken(account.google.tokenRef, opts.password);
  if (!token?.refreshToken) throw new Error(`No refresh token for ${account.google.tokenRef}`);

  const client = new GoogleAdsClient({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    developerToken: process.env.GOOGLE_DEVELOPER_TOKEN!,
    refreshToken: token.refreshToken,
    customerId: account.google.customerId,
    loginCustomerId: account.google.loginCustomerId,
  });

  const range = lastNDays(opts.lookbackDays);
  const spin = ora(`Fetching keywords`).start();
  const keywords = await client.getKeywords(range, opts.campaignId);
  spin.succeed(`${keywords.length} keywords`);

  keywords.sort((a, b) => b.clicks - a.clicks);
  const top = keywords.slice(0, 100);

  const lowQs = top.filter((k) => k.qualityScore !== null && k.qualityScore <= 4);
  const lowIs = top.filter((k) => k.impressionShare !== null && k.impressionShare < 50);

  const tableHtml = `<table>
    <thead><tr><th>Keyword</th><th>Match</th><th>QS</th><th>IS%</th><th>Impr</th><th>Clicks</th><th>Avg CPC</th><th>Conv</th></tr></thead>
    <tbody>${top
      .map(
        (k) => `<tr>
          <td>${escapeHtml(k.keyword)}</td>
          <td class="text-slate-400">${k.matchType}</td>
          <td class="${k.qualityScore !== null && k.qualityScore <= 4 ? 'text-rose-400' : 'text-emerald-400'}">${k.qualityScore ?? '—'}</td>
          <td class="${k.impressionShare !== null && k.impressionShare < 50 ? 'text-yellow-400' : ''}">${k.impressionShare?.toFixed(0) ?? '—'}</td>
          <td>${k.impressions.toLocaleString()}</td>
          <td>${k.clicks.toLocaleString()}</td>
          <td>$${k.avgCpc.toFixed(2)}</td>
          <td>${k.conversions.toFixed(1)}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const summaryHtml = `<div class="grid grid-cols-3 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Active keywords</div><div class="text-2xl font-bold mt-1">${keywords.length}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Low QS (≤4)</div><div class="text-2xl font-bold mt-1 text-rose-300">${lowQs.length}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Low IS (<50%)</div><div class="text-2xl font-bold mt-1 text-yellow-300">${lowIs.length}</div></div>
  </div>`;

  const htmlPath = await writeReport(
    {
      title: 'Google Ads — Keyword Analysis',
      subtitle: `${keywords.length} active keywords · top 100 by clicks`,
      platform: 'google',
      skill: 'keyword-analyzer',
      accountRef: opts.accountRef,
      period: range,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Top keywords', html: tableHtml },
      ],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Google Ads — Keyword Analysis',
      platform: 'google',
      skill: 'keyword-analyzer',
      summary: `${keywords.length} keywords · ${lowQs.length} low QS · ${lowIs.length} low IS`,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${keywords.length} keywords · ${lowQs.length} QS issues · ${lowIs.length} IS issues`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
