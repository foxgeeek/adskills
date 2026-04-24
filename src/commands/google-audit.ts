import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { GoogleAdsClient } from '../clients/google.js';
import { getToken } from '../core/auth.js';
import { lastNDays, previousWindow } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface GoogleAuditOptions {
  accountRef: string;
  lookbackDays: number;
  password: string;
  configPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: {
    google?: { customerId: string; loginCustomerId?: string; tokenRef: string };
  };
}

export async function runGoogleAudit(opts: GoogleAuditOptions): Promise<void> {
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

  const current = lastNDays(opts.lookbackDays);
  const previous = previousWindow(current);

  const spin = ora(`Fetching Google Ads insights`).start();
  const [currData, prevData] = await Promise.all([
    client.getInsights(current),
    client.getInsights(previous),
  ]);
  spin.succeed(`Got ${currData.length} current + ${prevData.length} previous data points`);

  const agg = (arr: typeof currData) =>
    arr.reduce(
      (acc, r) => {
        acc.impressions += r.impressions;
        acc.clicks += r.clicks;
        acc.spend += r.spend;
        acc.conversions += r.conversions ?? 0;
        return acc;
      },
      { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
    );

  const curr = agg(currData);
  const prev = agg(prevData);
  const delta = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);

  const metrics = [
    { name: 'Impressions', curr: curr.impressions, prev: prev.impressions, delta: delta(curr.impressions, prev.impressions), fmt: (n: number) => n.toLocaleString() },
    { name: 'Clicks', curr: curr.clicks, prev: prev.clicks, delta: delta(curr.clicks, prev.clicks), fmt: (n: number) => n.toLocaleString() },
    { name: 'CTR', curr: curr.impressions ? (curr.clicks / curr.impressions) * 100 : 0, prev: prev.impressions ? (prev.clicks / prev.impressions) * 100 : 0, delta: 0, fmt: (n: number) => `${n.toFixed(2)}%` },
    { name: 'Spend', curr: curr.spend, prev: prev.spend, delta: delta(curr.spend, prev.spend), fmt: (n: number) => `$${n.toFixed(2)}` },
    { name: 'CPC', curr: curr.clicks ? curr.spend / curr.clicks : 0, prev: prev.clicks ? prev.spend / prev.clicks : 0, delta: 0, fmt: (n: number) => `$${n.toFixed(2)}` },
    { name: 'Conversions', curr: curr.conversions, prev: prev.conversions, delta: delta(curr.conversions, prev.conversions), fmt: (n: number) => n.toFixed(1) },
    { name: 'CPA', curr: curr.conversions ? curr.spend / curr.conversions : 0, prev: prev.conversions ? prev.spend / prev.conversions : 0, delta: 0, fmt: (n: number) => `$${n.toFixed(2)}` },
  ];
  for (const m of metrics) m.delta = delta(m.curr, m.prev);

  const tableHtml = `<table>
    <thead><tr><th>Metric</th><th>Current</th><th>Previous</th><th>Δ</th></tr></thead>
    <tbody>${metrics
      .map(
        (m) => `<tr>
          <td>${m.name}</td>
          <td class="font-semibold">${m.fmt(m.curr)}</td>
          <td class="text-slate-400">${m.fmt(m.prev)}</td>
          <td class="${m.delta < 0 ? 'text-rose-400' : m.delta > 0 ? 'text-emerald-400' : 'text-slate-400'}">${m.delta.toFixed(1)}%</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const htmlPath = await writeReport(
    {
      title: 'Google Ads — Performance Audit',
      subtitle: `${opts.lookbackDays}d vs previous ${opts.lookbackDays}d`,
      platform: 'google',
      skill: 'performance-auditor',
      accountRef: opts.accountRef,
      period: current,
      sections: [{ heading: 'Period comparison', html: tableHtml }],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Google Ads — Performance Audit',
      platform: 'google',
      skill: 'performance-auditor',
      summary: `${opts.lookbackDays}d vs previous ${opts.lookbackDays}d · account \`${opts.accountRef}\``,
      table: {
        headers: ['Metric', 'Current', 'Previous', 'Δ'],
        rows: metrics.map((m) => [m.name, m.fmt(m.curr), m.fmt(m.prev), `${m.delta.toFixed(1)}%`]),
      },
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Audit complete`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
