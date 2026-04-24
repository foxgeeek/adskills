import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { GoogleAdsClient, type SearchTermRow } from '../clients/google.js';
import { getToken } from '../core/auth.js';
import { lastNDays } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface GoogleSearchTermsOptions {
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

type Intent = 'commercial' | 'informational' | 'navigational' | 'irrelevant' | 'unknown';

const COMMERCIAL_HINTS = ['comprar', 'preço', 'preco', 'quanto custa', 'contratar', 'orçamento', 'orcamento', 'buy', 'price', 'cost', 'hire', 'purchase'];
const INFORMATIONAL_HINTS = ['como', 'o que é', 'o que e', 'tutorial', 'guia', 'dica', 'how to', 'what is', 'guide', 'tips'];
const NAVIGATIONAL_HINTS = ['login', 'entrar', 'site', 'página', 'pagina'];

function classify(term: string): Intent {
  const t = term.toLowerCase();
  if (COMMERCIAL_HINTS.some((h) => t.includes(h))) return 'commercial';
  if (INFORMATIONAL_HINTS.some((h) => t.includes(h))) return 'informational';
  if (NAVIGATIONAL_HINTS.some((h) => t.includes(h))) return 'navigational';
  return 'unknown';
}

export async function runGoogleSearchTerms(opts: GoogleSearchTermsOptions): Promise<void> {
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
  const spin = ora('Fetching search terms').start();
  const terms = await client.getSearchTerms(range, opts.campaignId);
  spin.succeed(`${terms.length} search terms`);

  const buckets: Record<Intent, SearchTermRow[]> = {
    commercial: [],
    informational: [],
    navigational: [],
    irrelevant: [],
    unknown: [],
  };
  for (const t of terms) buckets[classify(t.searchTerm)].push(t);

  const sortByClicks = (a: SearchTermRow, b: SearchTermRow) => b.clicks - a.clicks;
  for (const key of Object.keys(buckets) as Intent[]) buckets[key].sort(sortByClicks);

  const renderSection = (label: string, rows: SearchTermRow[]) =>
    `<h3 class="text-lg font-semibold mt-6 text-slate-200">${label} · ${rows.length}</h3>
    <table class="mt-2">
      <thead><tr><th>Search term</th><th>Campaign</th><th>Clicks</th><th>Impr</th><th>CTR</th><th>Cost</th><th>Conv</th></tr></thead>
      <tbody>${rows
        .slice(0, 50)
        .map(
          (r) => `<tr>
            <td>${escapeHtml(r.searchTerm)}</td>
            <td class="text-slate-400">${escapeHtml(r.campaignName)}</td>
            <td>${r.clicks}</td>
            <td>${r.impressions}</td>
            <td>${r.ctr.toFixed(2)}%</td>
            <td>$${r.cost.toFixed(2)}</td>
            <td>${r.conversions.toFixed(1)}</td>
          </tr>`,
        )
        .join('')}</tbody></table>`;

  const summaryHtml = `<div class="grid grid-cols-5 gap-3">
    <div class="card rounded-lg p-3 text-center"><div class="text-xs text-slate-400">Commercial</div><div class="text-xl font-bold text-emerald-300 mt-1">${buckets.commercial.length}</div></div>
    <div class="card rounded-lg p-3 text-center"><div class="text-xs text-slate-400">Informational</div><div class="text-xl font-bold text-cyan-300 mt-1">${buckets.informational.length}</div></div>
    <div class="card rounded-lg p-3 text-center"><div class="text-xs text-slate-400">Navigational</div><div class="text-xl font-bold text-blue-300 mt-1">${buckets.navigational.length}</div></div>
    <div class="card rounded-lg p-3 text-center"><div class="text-xs text-slate-400">Irrelevant</div><div class="text-xl font-bold text-rose-300 mt-1">${buckets.irrelevant.length}</div></div>
    <div class="card rounded-lg p-3 text-center"><div class="text-xs text-slate-400">Unknown</div><div class="text-xl font-bold text-slate-400 mt-1">${buckets.unknown.length}</div></div>
  </div>`;

  const bodyHtml =
    summaryHtml +
    renderSection('Commercial intent', buckets.commercial) +
    renderSection('Informational', buckets.informational) +
    renderSection('Navigational', buckets.navigational) +
    renderSection('Unknown (review manually)', buckets.unknown);

  const htmlPath = await writeReport(
    {
      title: 'Google Ads — Search Terms',
      subtitle: `${terms.length} terms · ${opts.lookbackDays}d window`,
      platform: 'google',
      skill: 'search-terms',
      accountRef: opts.accountRef,
      period: range,
      sections: [{ heading: 'Classification', html: bodyHtml }],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Google Ads — Search Terms',
      platform: 'google',
      skill: 'search-terms',
      summary: `${terms.length} terms · ${buckets.commercial.length} commercial · ${buckets.informational.length} informational · ${buckets.unknown.length} unknown`,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${terms.length} terms classified`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
