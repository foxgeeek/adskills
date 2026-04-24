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
import type { PerformanceMetrics } from '../clients/types.js';

export interface DashboardOptions {
  accountRef: string;
  lookbackDays: number;
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

interface PlatformTotals {
  platform: 'Meta' | 'Google' | 'LinkedIn';
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas?: number;
  error?: string;
}

function aggregate(rows: PerformanceMetrics[], label: PlatformTotals['platform']): PlatformTotals {
  const t = rows.reduce(
    (acc, r) => {
      acc.impressions += r.impressions;
      acc.clicks += r.clicks;
      acc.spend += r.spend;
      acc.conversions += r.conversions ?? 0;
      return acc;
    },
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
  );
  return {
    platform: label,
    ...t,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
    cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    cpa: t.conversions > 0 ? t.spend / t.conversions : 0,
  };
}

export async function runDashboard(opts: DashboardOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account) throw new Error(`Account "${opts.accountRef}" not found`);

  const range = lastNDays(opts.lookbackDays);
  const spin = ora('Fetching insights across platforms').start();

  const results: PlatformTotals[] = [];

  if (account.meta) {
    try {
      const token = await getToken(account.meta.tokenRef, opts.password);
      if (token) {
        const client = new MetaClient({ accessToken: token.accessToken, adAccountId: account.meta.adAccountId });
        const insights = await client.getInsights(account.meta.adAccountId, range, 'campaign');
        results.push(aggregate(insights, 'Meta'));
      }
    } catch (err) {
      results.push({ platform: 'Meta', impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, error: err instanceof Error ? err.message : String(err) });
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
        results.push(aggregate(insights, 'Google'));
      }
    } catch (err) {
      results.push({ platform: 'Google', impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, error: err instanceof Error ? err.message : String(err) });
    }
  }
  if (account.linkedin) {
    try {
      const token = await getToken(account.linkedin.tokenRef, opts.password);
      if (token) {
        const client = new LinkedInClient({ accessToken: token.accessToken, accountId: account.linkedin.accountId });
        const insights = await client.getInsights(range);
        results.push(aggregate(insights, 'LinkedIn'));
      }
    } catch (err) {
      results.push({ platform: 'LinkedIn', impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, error: err instanceof Error ? err.message : String(err) });
    }
  }

  spin.succeed(`Pulled ${results.length} platforms`);

  const totalSpend = results.reduce((acc, r) => acc + r.spend, 0);
  const totalConversions = results.reduce((acc, r) => acc + r.conversions, 0);
  const totalClicks = results.reduce((acc, r) => acc + r.clicks, 0);
  const totalImpressions = results.reduce((acc, r) => acc + r.impressions, 0);

  const colors = { Meta: '#3b82f6', Google: '#fbbf24', LinkedIn: '#38bdf8' };

  const pieCfg = (metric: keyof PlatformTotals) => ({
    labels: results.map((r) => r.platform),
    datasets: [{
      data: results.map((r) => r[metric]),
      backgroundColor: results.map((r) => colors[r.platform]),
      borderWidth: 0,
    }],
  });

  const spendChart = `<div class="relative" style="height:280px"><canvas id="spend-chart"></canvas></div>
    <script>new Chart(document.getElementById('spend-chart'), { type: 'doughnut', data: ${JSON.stringify(pieCfg('spend'))}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cbd5e1' } }, title: { display: true, text: 'Spend share', color: '#e2e8f0' } } } });</script>`;
  const convChart = `<div class="relative" style="height:280px"><canvas id="conv-chart"></canvas></div>
    <script>new Chart(document.getElementById('conv-chart'), { type: 'doughnut', data: ${JSON.stringify(pieCfg('conversions'))}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cbd5e1' } }, title: { display: true, text: 'Conversion share', color: '#e2e8f0' } } } });</script>`;

  const summaryHtml = `<div class="grid grid-cols-4 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Total spend</div><div class="text-2xl font-bold mt-1">$${totalSpend.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Total clicks</div><div class="text-2xl font-bold mt-1">${totalClicks.toLocaleString()}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Total conv</div><div class="text-2xl font-bold mt-1">${totalConversions.toFixed(0)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Blended CPA</div><div class="text-2xl font-bold mt-1">${totalConversions > 0 ? `$${(totalSpend / totalConversions).toFixed(2)}` : '—'}</div></div>
  </div>`;

  const tableHtml = `<table>
    <thead><tr><th>Platform</th><th>Impr</th><th>Clicks</th><th>CTR</th><th>Spend</th><th>CPC</th><th>Conv</th><th>CPA</th><th>Spend %</th></tr></thead>
    <tbody>${results
      .map(
        (r) => `<tr>
          <td class="font-semibold" style="color:${colors[r.platform]}">${r.platform}</td>
          <td>${r.impressions.toLocaleString()}</td>
          <td>${r.clicks.toLocaleString()}</td>
          <td>${r.ctr.toFixed(2)}%</td>
          <td>$${r.spend.toFixed(2)}</td>
          <td>$${r.cpc.toFixed(2)}</td>
          <td>${r.conversions.toFixed(0)}</td>
          <td>${r.cpa > 0 ? `$${r.cpa.toFixed(2)}` : '—'}</td>
          <td>${totalSpend > 0 ? `${((r.spend / totalSpend) * 100).toFixed(1)}%` : '—'}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const errorsHtml = results.filter((r) => r.error).length
    ? `<ul class="space-y-1">${results.filter((r) => r.error).map((r) => `<li class="text-rose-300">${r.platform}: ${r.error}</li>`).join('')}</ul>`
    : '';

  const chartsHtml = `<div class="grid grid-cols-2 gap-6">${spendChart}${convChart}</div>`;

  const htmlPath = await writeReport(
    {
      title: 'Unified Dashboard — Cross-Platform Performance',
      subtitle: `Last ${opts.lookbackDays}d · ${results.length} platforms`,
      platform: 'cross',
      skill: 'dashboard',
      accountRef: opts.accountRef,
      period: range,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Share breakdown', html: chartsHtml },
        { heading: 'Platform totals', html: tableHtml },
        ...(errorsHtml ? [{ heading: 'Errors', html: errorsHtml }] : []),
      ],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Unified Dashboard',
      platform: 'cross',
      skill: 'dashboard',
      summary: `**$${totalSpend.toFixed(2)}** spend · **${totalClicks}** clicks · **${totalConversions.toFixed(0)}** conv across ${results.length} platforms`,
      table: {
        headers: ['Platform', 'Spend', 'Clicks', 'Conv', 'CPA'],
        rows: results.map((r) => [
          r.platform,
          `$${r.spend.toFixed(2)}`,
          String(r.clicks),
          String(r.conversions.toFixed(0)),
          r.cpa > 0 ? `$${r.cpa.toFixed(2)}` : '—',
        ]),
      },
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Dashboard · $${totalSpend.toFixed(2)} across ${results.length} platforms`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
