import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { LinkedInClient } from '../clients/linkedin.js';
import { getToken } from '../core/auth.js';
import { lastNDays } from '../utils/date-ranges.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface LinkedInBidOptions {
  accountRef: string;
  lookbackDays: number;
  minCtrPct: number;
  maxCpcRaiseRatio: number;
  adjustPct: number;
  apply: boolean;
  password: string;
  configPath: string;
  reportsDir: string;
}

interface AccountsFile {
  [key: string]: { linkedin?: { accountId: string; tokenRef: string } };
}

export async function runLinkedInBidOptimizer(opts: LinkedInBidOptions): Promise<void> {
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
  const spin = ora('Fetching campaigns + insights').start();
  const campaigns = await client.listCampaigns();
  const rows: Array<{
    id: string;
    name: string;
    status: string;
    bid: number | undefined;
    ctr: number;
    cpc: number;
    conversions: number;
    spend: number;
    suggestion: 'raise' | 'lower' | 'hold';
    newBid?: number;
  }> = [];

  let done = 0;
  for (const c of campaigns) {
    try {
      const insights = (await client.getInsights(range, c.id))[0];
      if (!insights) {
        done++;
        continue;
      }
      const suggestion: 'raise' | 'lower' | 'hold' =
        insights.ctr >= opts.minCtrPct && (insights.conversions ?? 0) > 0
          ? 'raise'
          : insights.cpc > (c.bidAmount ?? 0) * opts.maxCpcRaiseRatio
            ? 'lower'
            : 'hold';
      const newBid =
        suggestion !== 'hold' && c.bidAmount
          ? suggestion === 'raise'
            ? c.bidAmount * (1 + opts.adjustPct / 100)
            : c.bidAmount * (1 - opts.adjustPct / 100)
          : undefined;
      rows.push({
        id: c.id,
        name: c.name,
        status: c.status,
        bid: c.bidAmount,
        ctr: insights.ctr,
        cpc: insights.cpc,
        conversions: insights.conversions ?? 0,
        spend: insights.spend,
        suggestion,
        newBid,
      });
    } catch {
      /* skip on insight fetch error */
    }
    done++;
    spin.text = `Fetching insights (${done}/${campaigns.length})`;
  }
  spin.succeed(`${rows.length} campaigns analyzed`);

  const toApply = rows.filter((r) => r.suggestion !== 'hold' && r.newBid !== undefined);

  const tableHtml = `<table>
    <thead><tr><th>Campaign</th><th>Status</th><th>Current bid</th><th>CTR</th><th>CPC</th><th>Conv</th><th>Suggestion</th><th>New bid</th></tr></thead>
    <tbody>${rows
      .map((r) => {
        const color =
          r.suggestion === 'raise' ? 'text-emerald-400' : r.suggestion === 'lower' ? 'text-rose-400' : 'text-slate-400';
        return `<tr>
          <td>${escapeHtml(r.name)}</td>
          <td>${r.status}</td>
          <td>$${(r.bid ?? 0).toFixed(2)}</td>
          <td>${r.ctr.toFixed(2)}%</td>
          <td>$${r.cpc.toFixed(2)}</td>
          <td>${r.conversions.toFixed(0)}</td>
          <td class="${color} font-semibold">${r.suggestion}</td>
          <td>${r.newBid ? `$${r.newBid.toFixed(2)}` : '—'}</td>
        </tr>`;
      })
      .join('')}</tbody></table>`;

  const htmlPath = await writeReport(
    {
      title: 'LinkedIn Ads — Bid Optimizer',
      subtitle: `${toApply.length} of ${rows.length} campaigns flagged for adjustment`,
      platform: 'linkedin',
      skill: 'bid-optimizer',
      accountRef: opts.accountRef,
      period: range,
      sections: [{ heading: 'Suggestions', html: tableHtml }],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'LinkedIn Ads — Bid Optimizer',
      platform: 'linkedin',
      skill: 'bid-optimizer',
      summary: `${toApply.length} / ${rows.length} campaigns suggested for bid change · ±${opts.adjustPct}%`,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${toApply.length} suggestions`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));

  if (opts.apply && toApply.length > 0) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Apply bid changes to ${toApply.length} campaigns?`,
      initial: false,
    });
    if (!confirmed) return;
    for (const r of toApply) {
      const spin = ora(`Updating ${r.name}`).start();
      try {
        await client.updateCampaign(r.id, { unitCost: r.newBid });
        spin.succeed(`${r.name} → $${r.newBid!.toFixed(2)}`);
      } catch (err) {
        spin.fail(`${r.name} — ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
