import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { MetaClient } from '../clients/meta.js';
import { GoogleAdsClient } from '../clients/google.js';
import { LinkedInClient } from '../clients/linkedin.js';
import { getToken } from '../core/auth.js';
import { lastNDays } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface RebalanceOptions {
  accountRef: string;
  lookbackDays: number;
  totalBudget: number;
  password: string;
  configPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: {
    meta?: { adAccountId: string; tokenRef: string };
    google?: { customerId: string; loginCustomerId?: string; tokenRef: string };
    linkedin?: { accountId: string; tokenRef: string };
  };
}

interface PlatformStats {
  platform: string;
  spend: number;
  conversions: number;
  clicks: number;
  cpa: number;
  efficiency: number;
}

export async function runRebalance(opts: RebalanceOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account) throw new Error(`Account "${opts.accountRef}" not found`);

  const range = lastNDays(opts.lookbackDays);
  const spin = ora('Fetching cross-platform performance').start();

  const stats: PlatformStats[] = [];

  if (account.meta) {
    try {
      const token = await getToken(account.meta.tokenRef, opts.password);
      if (token) {
        const client = new MetaClient({ accessToken: token.accessToken, adAccountId: account.meta.adAccountId });
        const insights = await client.getInsights(account.meta.adAccountId, range, 'campaign');
        const spend = insights.reduce((a, r) => a + r.spend, 0);
        const conversions = insights.reduce((a, r) => a + (r.conversions ?? 0), 0);
        const clicks = insights.reduce((a, r) => a + r.clicks, 0);
        stats.push({
          platform: 'Meta',
          spend,
          conversions,
          clicks,
          cpa: conversions > 0 ? spend / conversions : Infinity,
          efficiency: 0,
        });
      }
    } catch {
      /* skip */
    }
  }
  if (account.google) {
    try {
      const token = await getToken(account.google.tokenRef, opts.password);
      if (token?.refreshToken) {
        const client = new GoogleAdsClient({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          developerToken: process.env.GOOGLE_DEVELOPER_TOKEN!,
          refreshToken: token.refreshToken,
          customerId: account.google.customerId,
          loginCustomerId: account.google.loginCustomerId,
        });
        const insights = await client.getInsights(range);
        const spend = insights.reduce((a, r) => a + r.spend, 0);
        const conversions = insights.reduce((a, r) => a + (r.conversions ?? 0), 0);
        const clicks = insights.reduce((a, r) => a + r.clicks, 0);
        stats.push({
          platform: 'Google',
          spend,
          conversions,
          clicks,
          cpa: conversions > 0 ? spend / conversions : Infinity,
          efficiency: 0,
        });
      }
    } catch {
      /* skip */
    }
  }
  if (account.linkedin) {
    try {
      const token = await getToken(account.linkedin.tokenRef, opts.password);
      if (token) {
        const client = new LinkedInClient({ accessToken: token.accessToken, accountId: account.linkedin.accountId });
        const insights = await client.getInsights(range);
        const spend = insights.reduce((a, r) => a + r.spend, 0);
        const conversions = insights.reduce((a, r) => a + (r.conversions ?? 0), 0);
        const clicks = insights.reduce((a, r) => a + r.clicks, 0);
        stats.push({
          platform: 'LinkedIn',
          spend,
          conversions,
          clicks,
          cpa: conversions > 0 ? spend / conversions : Infinity,
          efficiency: 0,
        });
      }
    } catch {
      /* skip */
    }
  }
  spin.succeed(`${stats.length} platforms analyzed`);

  const conversiveStats = stats.filter((s) => s.conversions > 0);
  if (conversiveStats.length === 0) {
    console.log(kleur.yellow('No conversions across platforms — rebalance requires conversion data'));
    return;
  }

  const minCpa = Math.min(...conversiveStats.map((s) => s.cpa));
  for (const s of stats) {
    s.efficiency = s.cpa === Infinity ? 0 : minCpa / s.cpa;
  }

  const totalEff = stats.reduce((a, s) => a + s.efficiency, 0);
  const recommended = stats.map((s) => ({
    ...s,
    recommendedBudget: totalEff > 0 ? (s.efficiency / totalEff) * opts.totalBudget : 0,
    currentShare: s.spend,
    delta: 0,
  }));
  const currentTotal = stats.reduce((a, s) => a + s.spend, 0);
  for (const r of recommended) {
    r.currentShare = currentTotal > 0 ? (r.spend / currentTotal) * opts.totalBudget : 0;
    r.delta = r.recommendedBudget - r.currentShare;
  }

  const tableHtml = `<table>
    <thead><tr><th>Platform</th><th>Spend</th><th>Conv</th><th>CPA</th><th>Efficiency</th><th>Current share</th><th>Recommended</th><th>Δ</th></tr></thead>
    <tbody>${recommended
      .map(
        (r) => `<tr>
          <td class="font-semibold">${r.platform}</td>
          <td>$${r.spend.toFixed(2)}</td>
          <td>${r.conversions.toFixed(0)}</td>
          <td>${r.cpa === Infinity ? '—' : `$${r.cpa.toFixed(2)}`}</td>
          <td>${(r.efficiency * 100).toFixed(0)}%</td>
          <td>$${r.currentShare.toFixed(2)}</td>
          <td class="font-semibold text-emerald-300">$${r.recommendedBudget.toFixed(2)}</td>
          <td class="${r.delta > 0 ? 'text-emerald-400' : r.delta < 0 ? 'text-rose-400' : 'text-slate-400'}">${r.delta >= 0 ? '+' : ''}$${r.delta.toFixed(2)}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const summaryHtml = `<div class="grid grid-cols-3 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Total budget</div><div class="text-2xl font-bold mt-1">$${opts.totalBudget.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Best CPA</div><div class="text-2xl font-bold mt-1 text-emerald-300">$${minCpa.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Lookback</div><div class="text-xl mt-1">${opts.lookbackDays}d</div></div>
  </div>`;

  const htmlPath = await writeReport(
    {
      title: 'Cross-Platform — Budget Rebalance',
      subtitle: `Efficiency-weighted allocation over $${opts.totalBudget.toFixed(2)}`,
      platform: 'cross',
      skill: 'budget-rebalance',
      accountRef: opts.accountRef,
      period: range,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Recommended allocation', html: tableHtml },
      ],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Cross-Platform — Budget Rebalance',
      platform: 'cross',
      skill: 'budget-rebalance',
      summary: `Budget **$${opts.totalBudget.toFixed(2)}** · best CPA $${minCpa.toFixed(2)}`,
      table: {
        headers: ['Platform', 'Current', 'Recommended', 'Δ'],
        rows: recommended.map((r) => [
          r.platform,
          `$${r.currentShare.toFixed(2)}`,
          `$${r.recommendedBudget.toFixed(2)}`,
          `${r.delta >= 0 ? '+' : ''}$${r.delta.toFixed(2)}`,
        ]),
      },
      notes: ['Recommendation is read-only — apply manually in each platform dashboard after review'],
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Rebalance over $${opts.totalBudget.toFixed(2)}`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
