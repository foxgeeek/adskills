import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import { LinkedInClient } from '../clients/linkedin.js';
import { getToken } from '../core/auth.js';
import { lastNDays } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface LinkedInCreativeOptions {
  accountRef: string;
  campaignId: string;
  lookbackDays: number;
  password: string;
  configPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: { linkedin?: { accountId: string; tokenRef: string } };
}

export async function runLinkedInCreativeStrategist(
  opts: LinkedInCreativeOptions,
): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.linkedin) throw new Error(`Account "${opts.accountRef}" missing linkedin config`);
  const token = await getToken(account.linkedin.tokenRef, opts.password);
  if (!token) throw new Error(`No token for ${account.linkedin.tokenRef}`);

  const client = new LinkedInClient({
    accessToken: token.accessToken,
    accountId: account.linkedin.accountId,
  });

  const range = lastNDays(opts.lookbackDays);
  const spin = ora('Fetching creative insights').start();
  const creatives = await client.getCreativeInsights(range, opts.campaignId);
  spin.succeed(`${creatives.length} creatives`);

  const byFormat = new Map<
    string,
    { impressions: number; clicks: number; spend: number; leads: number; count: number }
  >();
  for (const c of creatives) {
    const agg = byFormat.get(c.format) ?? { impressions: 0, clicks: 0, spend: 0, leads: 0, count: 0 };
    agg.impressions += c.impressions;
    agg.clicks += c.clicks;
    agg.spend += c.spend;
    agg.leads += c.leadFormCompletions;
    agg.count += 1;
    byFormat.set(c.format, agg);
  }

  const formatRows = Array.from(byFormat.entries())
    .map(([format, m]) => ({
      format,
      count: m.count,
      impressions: m.impressions,
      clicks: m.clicks,
      spend: m.spend,
      leads: m.leads,
      ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      cpl: m.leads > 0 ? m.spend / m.leads : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const best = formatRows[0];
  const worst = formatRows[formatRows.length - 1];

  const suggestions: string[] = [];
  if (best && best.ctr > 1 && best.leads > 0) {
    suggestions.push(`Double down on ${best.format} — ${best.ctr.toFixed(2)}% CTR, $${best.cpl.toFixed(2)} CPL across ${best.count} creatives`);
  }
  if (worst && worst !== best && worst.spend > 100 && worst.leads === 0) {
    suggestions.push(`Consider pausing ${worst.format} — $${worst.spend.toFixed(2)} spent with 0 leads`);
  }
  if (formatRows.length < 2) {
    suggestions.push('Only one creative format in flight — test a second format (carousel vs single image, or document ad) to benchmark');
  }

  const tableHtml = `<table>
    <thead><tr><th>Format</th><th># Creatives</th><th>Impr</th><th>Clicks</th><th>CTR</th><th>Spend</th><th>Leads</th><th>CPL</th></tr></thead>
    <tbody>${formatRows
      .map(
        (r) => `<tr>
          <td class="font-semibold">${r.format}</td>
          <td>${r.count}</td>
          <td>${r.impressions.toLocaleString()}</td>
          <td>${r.clicks.toLocaleString()}</td>
          <td>${r.ctr.toFixed(2)}%</td>
          <td>$${r.spend.toFixed(2)}</td>
          <td>${r.leads}</td>
          <td>${r.cpl > 0 ? `$${r.cpl.toFixed(2)}` : '—'}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const suggestionsHtml = suggestions.length
    ? `<ul class="space-y-2">${suggestions.map((s) => `<li class="text-emerald-300">→ ${s}</li>`).join('')}</ul>`
    : `<p class="text-slate-400">No actionable suggestions.</p>`;

  const htmlPath = await writeReport(
    {
      title: 'LinkedIn Ads — Creative Strategy',
      subtitle: `Campaign ${opts.campaignId} · ${creatives.length} creatives across ${formatRows.length} formats`,
      platform: 'linkedin',
      skill: 'creative-strategist',
      accountRef: opts.accountRef,
      period: range,
      sections: [
        { heading: 'Format performance', html: tableHtml },
        { heading: 'Suggestions', html: suggestionsHtml },
      ],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'LinkedIn Ads — Creative Strategy',
      platform: 'linkedin',
      skill: 'creative-strategist',
      summary: `${creatives.length} creatives · ${formatRows.length} formats · campaign \`${opts.campaignId}\``,
      notes: suggestions,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${creatives.length} creatives analyzed`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
