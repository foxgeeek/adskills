import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { GoogleAdsClient } from '../clients/google.js';
import { getToken } from '../core/auth.js';
import { lastNDays } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface GoogleNegativesOptions {
  accountRef: string;
  campaignId?: string;
  lookbackDays: number;
  minImpressions: number;
  maxCtrPct: number;
  minSpend: number;
  password: string;
  configPath: string;
  reportsDir: string;
  apply?: boolean;
  adGroupResourceName?: string;
}

interface AccountsFile {
  [key: string]: { google?: { customerId: string; loginCustomerId?: string; tokenRef: string } };
}

export async function runGoogleNegatives(opts: GoogleNegativesOptions): Promise<void> {
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
  const spin = ora('Mining search terms').start();
  const terms = await client.getSearchTerms(range, opts.campaignId);
  spin.succeed(`${terms.length} search terms analyzed`);

  const candidates = terms.filter(
    (t) =>
      t.impressions >= opts.minImpressions &&
      t.ctr <= opts.maxCtrPct &&
      t.cost >= opts.minSpend &&
      t.conversions === 0,
  );
  candidates.sort((a, b) => b.cost - a.cost);

  const tableHtml = `<table>
    <thead><tr><th>Term</th><th>Campaign</th><th>Impr</th><th>Clicks</th><th>CTR</th><th>Cost</th></tr></thead>
    <tbody>${candidates
      .map(
        (c) => `<tr>
          <td>${escapeHtml(c.searchTerm)}</td>
          <td class="text-slate-400">${escapeHtml(c.campaignName)}</td>
          <td>${c.impressions}</td>
          <td>${c.clicks}</td>
          <td class="text-rose-300">${c.ctr.toFixed(2)}%</td>
          <td class="text-rose-300">$${c.cost.toFixed(2)}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const wastedSpend = candidates.reduce((acc, c) => acc + c.cost, 0);
  const summaryHtml = `<div class="grid grid-cols-3 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Negative candidates</div><div class="text-2xl font-bold mt-1">${candidates.length}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Wasted spend</div><div class="text-2xl font-bold mt-1 text-rose-300">$${wastedSpend.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Filters</div><div class="mt-1 text-sm">impr ≥ ${opts.minImpressions} · CTR ≤ ${opts.maxCtrPct}% · spend ≥ $${opts.minSpend} · 0 conv</div></div>
  </div>`;

  const htmlPath = await writeReport(
    {
      title: 'Google Ads — Negative Keyword Candidates',
      subtitle: `$${wastedSpend.toFixed(2)} wasted on ${candidates.length} zero-conversion terms`,
      platform: 'google',
      skill: 'negative-keywords',
      accountRef: opts.accountRef,
      period: range,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Candidates', html: tableHtml },
      ],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Google Ads — Negative Keyword Candidates',
      platform: 'google',
      skill: 'negative-keywords',
      summary: `**${candidates.length}** candidates · **$${wastedSpend.toFixed(2)}** wasted spend`,
      table: {
        headers: ['Term', 'Campaign', 'Clicks', 'CTR', 'Cost'],
        rows: candidates.slice(0, 50).map((c) => [
          c.searchTerm,
          c.campaignName,
          String(c.clicks),
          `${c.ctr.toFixed(2)}%`,
          `$${c.cost.toFixed(2)}`,
        ]),
      },
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${candidates.length} negative candidates · $${wastedSpend.toFixed(2)} wasted`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));

  if (opts.apply) {
    if (!opts.adGroupResourceName) {
      console.log(kleur.yellow('--apply requires --ad-group <resource_name>'));
      return;
    }
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Add ${candidates.length} EXACT-match negatives to ${opts.adGroupResourceName}?`,
      initial: false,
    });
    if (!confirmed) return;
    const result = await client.addNegativeKeywords(
      opts.adGroupResourceName,
      candidates.map((c) => ({ text: c.searchTerm, matchType: 'EXACT' as const })),
    );
    console.log(kleur.green(`✓ ${result.created} negatives created`));
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
