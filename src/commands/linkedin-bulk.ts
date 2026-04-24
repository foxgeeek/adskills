import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { LinkedInClient } from '../clients/linkedin.js';
import { getToken } from '../core/auth.js';
import { parseCsv } from '../utils/csv-parser.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface LinkedInBulkOptions {
  accountRef: string;
  csvPath: string;
  password: string;
  configPath: string;
  reportsDir: string;
  dryRun?: boolean;
}

interface AccountsFile {
  [key: string]: { linkedin?: { accountId: string; tokenRef: string } };
}

interface BulkEdit {
  id: string;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  dailyBudget?: number;
  unitCost?: number;
}

function parseEdit(row: Record<string, string>): BulkEdit | null {
  const id = row.campaign_id ?? row.id;
  if (!id) return null;
  const edit: BulkEdit = { id };
  if (row.status) {
    const s = row.status.toUpperCase();
    if (s === 'ACTIVE' || s === 'PAUSED' || s === 'ARCHIVED') edit.status = s;
  }
  if (row.daily_budget) edit.dailyBudget = Number(row.daily_budget);
  if (row.unit_cost || row.bid) edit.unitCost = Number(row.unit_cost ?? row.bid);
  return Object.keys(edit).length > 1 ? edit : null;
}

export async function runLinkedInBulkEdit(opts: LinkedInBulkOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.linkedin) throw new Error(`Account "${opts.accountRef}" missing linkedin config`);
  const token = await getToken(account.linkedin.tokenRef, opts.password);
  if (!token) throw new Error(`No token for ${account.linkedin.tokenRef}`);

  const rows = await parseCsv(resolve(opts.csvPath));
  const edits = rows.map(parseEdit).filter((e): e is BulkEdit => e !== null);
  if (edits.length === 0) throw new Error('No valid edits — need campaign_id + at least one of status/daily_budget/unit_cost');

  console.log(kleur.bold().cyan('\nBulk edit preview:'));
  for (const e of edits.slice(0, 20)) {
    const changes: string[] = [];
    if (e.status) changes.push(`status=${e.status}`);
    if (e.dailyBudget !== undefined) changes.push(`daily=${e.dailyBudget}`);
    if (e.unitCost !== undefined) changes.push(`bid=${e.unitCost}`);
    console.log(`  ${kleur.gray('•')} ${e.id}: ${changes.join(', ')}`);
  }
  if (edits.length > 20) console.log(`  ${kleur.gray(`... and ${edits.length - 20} more`)}`);

  if (!opts.dryRun) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Apply ${edits.length} campaign edits?`,
      initial: false,
    });
    if (!confirmed) return;
  }

  const client = new LinkedInClient({
    accessToken: token.accessToken,
    accountId: account.linkedin.accountId,
  });

  const results: Array<{ id: string; ok: boolean; error?: string; changes: string }> = [];
  for (const e of edits) {
    const changes = [
      e.status ? `status=${e.status}` : null,
      e.dailyBudget !== undefined ? `daily=${e.dailyBudget}` : null,
      e.unitCost !== undefined ? `bid=${e.unitCost}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    const spin = ora(`Updating ${e.id}`).start();
    try {
      if (opts.dryRun) {
        spin.succeed(`${e.id} — dry run (${changes})`);
        results.push({ id: e.id, ok: true, changes });
      } else {
        await client.updateCampaign(e.id, {
          status: e.status,
          dailyBudget: e.dailyBudget,
          unitCost: e.unitCost,
        });
        spin.succeed(`${e.id} — ${changes}`);
        results.push({ id: e.id, ok: true, changes });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      spin.fail(`${e.id} — ${msg}`);
      results.push({ id: e.id, ok: false, error: msg, changes });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;

  const tableHtml = `<table>
    <thead><tr><th>Campaign</th><th>Changes</th><th>Status</th></tr></thead>
    <tbody>${results
      .map(
        (r) => `<tr>
          <td><code>${r.id}</code></td>
          <td>${r.changes}</td>
          <td>${r.ok ? '<span class="text-emerald-400">✓</span>' : `<span class="text-rose-400">✗ ${r.error}</span>`}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const htmlPath = await writeReport(
    {
      title: 'LinkedIn Ads — Bulk Edit',
      subtitle: `${ok} ok · ${failed} failed`,
      platform: 'linkedin',
      skill: 'bulk-editor',
      accountRef: opts.accountRef,
      sections: [{ heading: 'Edits', html: tableHtml }],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'LinkedIn Ads — Bulk Edit',
      platform: 'linkedin',
      skill: 'bulk-editor',
      summary: `${ok} / ${results.length} edits applied`,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ ${ok} applied · ${failed} failed`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
