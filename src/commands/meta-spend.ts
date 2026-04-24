import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { MetaClient } from '../clients/meta.js';
import { getToken } from '../core/auth.js';
import { daysInMonth, monthToDate } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface MetaSpendOptions {
  accountRef: string;
  monthlyBudget?: number;
  password: string;
  configPath: string;
  thresholdsPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: { meta?: { adAccountId: string; tokenRef: string } };
}

interface Thresholds {
  spend: { dailyBurnAlertPct: number; monthlyProjectionAlertPct: number };
}

export async function runMetaSpend(opts: MetaSpendOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.meta) throw new Error(`Account "${opts.accountRef}" missing meta config`);
  const thresholds = JSON.parse(await readFile(opts.thresholdsPath, 'utf8')) as Thresholds;

  const token = await getToken(account.meta.tokenRef, opts.password);
  if (!token) throw new Error(`No token for ${account.meta.tokenRef}`);

  const client = new MetaClient({
    accessToken: token.accessToken,
    adAccountId: account.meta.adAccountId,
  });

  const range = monthToDate();
  const now = new Date();
  const totalDays = daysInMonth(now.getUTCFullYear(), now.getUTCMonth());
  const daysElapsed = Math.max(1, Math.round((new Date(range.until).getTime() - new Date(range.since).getTime()) / 86400000) + 1);

  const spin = ora(`Fetching daily spend (${range.since}→${range.until})`).start();
  const daily = await client.getDailyInsights(account.meta.adAccountId, range, 'campaign');
  spin.succeed(`Got ${daily.length} daily data points`);

  const byDate = new Map<string, number>();
  for (const d of daily) byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.spend);

  const series = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
  const totalSpend = series.reduce((acc, [, v]) => acc + v, 0);
  const avgDaily = totalSpend / Math.max(1, series.length);
  const projected = avgDaily * totalDays;

  const budget = opts.monthlyBudget;
  const pacePct = budget ? (totalSpend / budget) * 100 : undefined;
  const expectedPacePct = (daysElapsed / totalDays) * 100;
  const projectionPct = budget ? (projected / budget) * 100 : undefined;

  const alerts: string[] = [];
  if (budget && pacePct !== undefined) {
    const burnRatio = (pacePct / expectedPacePct) * 100;
    if (burnRatio >= thresholds.spend.dailyBurnAlertPct) {
      alerts.push(`Burning ${burnRatio.toFixed(0)}% of expected pace (threshold ${thresholds.spend.dailyBurnAlertPct}%)`);
    }
    if (projectionPct !== undefined && projectionPct >= thresholds.spend.monthlyProjectionAlertPct) {
      alerts.push(`Projected to hit ${projectionPct.toFixed(0)}% of budget (threshold ${thresholds.spend.monthlyProjectionAlertPct}%)`);
    }
  }

  const labels = series.map(([d]) => d);
  const values = series.map(([, v]) => v);
  const chartId = `chart-${Date.now()}`;
  const chartHtml = `
    <div class="relative" style="height:320px">
      <canvas id="${chartId}"></canvas>
    </div>
    <script>
      new Chart(document.getElementById('${chartId}'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(labels)},
          datasets: [{
            label: 'Daily spend',
            data: ${JSON.stringify(values)},
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.1)',
            fill: true,
            tension: 0.25,
          }${budget ? `, { label: 'Even pace', data: ${JSON.stringify(labels.map((_, i) => (budget / totalDays) * (i + 1)))}, borderColor: '#64748b', borderDash: [4,4], fill: false }` : ''}]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }
          }
        }
      });
    </script>`;

  const summaryHtml = `<div class="grid grid-cols-4 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">MTD spend</div><div class="text-2xl font-bold mt-1">$${totalSpend.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Avg daily</div><div class="text-2xl font-bold mt-1">$${avgDaily.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Projected month</div><div class="text-2xl font-bold mt-1">$${projected.toFixed(2)}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">${budget ? 'Pace vs budget' : 'Days elapsed'}</div><div class="text-2xl font-bold mt-1 ${pacePct && pacePct > expectedPacePct ? 'text-rose-300' : 'text-emerald-300'}">${budget ? `${pacePct!.toFixed(0)}% / ${expectedPacePct.toFixed(0)}% expected` : `${daysElapsed}/${totalDays}`}</div></div>
  </div>`;

  const alertsHtml = alerts.length
    ? `<ul class="space-y-2">${alerts.map((a) => `<li class="text-rose-300">⚠ ${a}</li>`).join('')}</ul>`
    : `<p class="text-emerald-300">No alerts — pacing within thresholds.</p>`;

  const htmlPath = await writeReport(
    {
      title: 'Meta Ads — Spend Tracker',
      subtitle: `Month to date (${range.since}→${range.until})`,
      platform: 'meta',
      skill: 'spend-tracker',
      accountRef: opts.accountRef,
      period: range,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Daily spend', html: chartHtml },
        { heading: 'Alerts', html: alertsHtml },
      ],
    },
    opts.reportsDir,
  );

  const mdPath = await writeMarkdownReport(
    {
      title: 'Meta Ads — Spend Tracker',
      platform: 'meta',
      skill: 'spend-tracker',
      summary: `MTD **$${totalSpend.toFixed(2)}** · avg daily $${avgDaily.toFixed(2)} · projected month **$${projected.toFixed(2)}**${budget ? ` vs budget $${budget.toFixed(2)}` : ''}`,
      notes: alerts.length > 0 ? alerts : ['No alerts.'],
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ MTD $${totalSpend.toFixed(2)} — projected $${projected.toFixed(2)}`));
  if (alerts.length) {
    for (const a of alerts) console.log(kleur.red(`  ⚠ ${a}`));
  }
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
