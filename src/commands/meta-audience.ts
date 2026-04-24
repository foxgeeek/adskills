import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { MetaClient } from '../clients/meta.js';
import { getToken } from '../core/auth.js';
import { logger } from '../core/logger.js';
import { parseCsv } from '../utils/csv-parser.js';
import { hashEmail, hashName, hashPhone } from '../utils/hash-pii.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface MetaAudienceOptions {
  accountRef: string;
  csvPath: string;
  audienceName: string;
  description?: string;
  batchSize?: number;
  password: string;
  configPath: string;
  reportsDir: string;
  dryRun?: boolean;
}

interface AccountsFile {
  [key: string]: { meta?: { adAccountId: string; tokenRef: string } };
}

const SCHEMA_MAP: Record<string, 'EMAIL' | 'PHONE' | 'FN' | 'LN'> = {
  email: 'EMAIL',
  e_mail: 'EMAIL',
  mail: 'EMAIL',
  phone: 'PHONE',
  telefone: 'PHONE',
  celular: 'PHONE',
  whatsapp: 'PHONE',
  first_name: 'FN',
  nome: 'FN',
  firstname: 'FN',
  last_name: 'LN',
  sobrenome: 'LN',
  lastname: 'LN',
};

function detectSchema(headers: string[]): Array<{ col: string; field: 'EMAIL' | 'PHONE' | 'FN' | 'LN' }> {
  const out: Array<{ col: string; field: 'EMAIL' | 'PHONE' | 'FN' | 'LN' }> = [];
  for (const h of headers) {
    const key = h.toLowerCase().replace(/\s+/g, '_');
    const field = SCHEMA_MAP[key];
    if (field) out.push({ col: h, field });
  }
  return out;
}

function hashCell(field: 'EMAIL' | 'PHONE' | 'FN' | 'LN', value: string): string {
  if (field === 'EMAIL') return hashEmail(value) ?? '';
  if (field === 'PHONE') return hashPhone(value) ?? '';
  return hashName(value) ?? '';
}

export async function runMetaAudienceUpload(opts: MetaAudienceOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.meta) throw new Error(`Account "${opts.accountRef}" missing meta config`);

  const token = await getToken(account.meta.tokenRef, opts.password);
  if (!token) throw new Error(`No token for ${account.meta.tokenRef}`);

  const rows = await parseCsv(resolve(opts.csvPath));
  if (rows.length === 0) throw new Error('CSV is empty');
  const headers = Object.keys(rows[0]!);
  const schemaCols = detectSchema(headers);
  if (schemaCols.length === 0) {
    throw new Error(
      `Could not detect PII columns. Supported headers: ${Object.keys(SCHEMA_MAP).join(', ')}`,
    );
  }

  const schema = schemaCols.map((s) => s.field);
  const hashedRows: string[][] = [];
  let invalid = 0;
  for (const row of rows) {
    const hashed = schemaCols.map(({ col, field }) => hashCell(field, row[col] ?? ''));
    if (hashed.every((h) => h === '')) {
      invalid++;
      continue;
    }
    hashedRows.push(hashed);
  }

  console.log(kleur.bold().cyan('\nAudience preview:'));
  console.log(`  CSV rows:        ${rows.length}`);
  console.log(`  Valid hashed:    ${hashedRows.length}`);
  console.log(`  Skipped:         ${invalid}`);
  console.log(`  Detected fields: ${schema.join(', ')}`);
  console.log(`  Audience name:   ${opts.audienceName}`);
  console.log(`  Account:         ${opts.accountRef}`);

  if (!opts.dryRun) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Create audience "${opts.audienceName}" and upload ${hashedRows.length} rows?`,
      initial: false,
    });
    if (!confirmed) return logger.info('Aborted');
  }

  const client = new MetaClient({
    accessToken: token.accessToken,
    adAccountId: account.meta.adAccountId,
  });

  let audienceId = 'dry-run';
  const batchSize = opts.batchSize ?? 5000;
  const batches: Array<{ count: number; invalid: number; ok: boolean; error?: string }> = [];

  if (opts.dryRun) {
    batches.push({ count: hashedRows.length, invalid: 0, ok: true });
  } else {
    const spin = ora(`Creating audience "${opts.audienceName}"`).start();
    try {
      const created = await client.createCustomAudience(
        opts.audienceName,
        opts.description ?? `Uploaded from ${opts.csvPath}`,
      );
      audienceId = created.id;
      spin.succeed(`Audience created: ${audienceId}`);
    } catch (err) {
      spin.fail(`Audience creation failed: ${err instanceof Error ? err.message : err}`);
      throw err;
    }

    for (let i = 0; i < hashedRows.length; i += batchSize) {
      const batch = hashedRows.slice(i, i + batchSize);
      const s = ora(`Batch ${i / batchSize + 1}: ${batch.length} rows`).start();
      try {
        const r = await client.addUsersToAudience(audienceId, schema, batch);
        batches.push({ count: r.num_received, invalid: r.num_invalid_entries, ok: true });
        s.succeed(`Batch ${i / batchSize + 1}: ${r.num_received} received, ${r.num_invalid_entries} invalid`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        batches.push({ count: 0, invalid: batch.length, ok: false, error: msg });
        s.fail(`Batch ${i / batchSize + 1}: ${msg}`);
      }
    }
  }

  const totalReceived = batches.reduce((acc, b) => acc + b.count, 0);
  const totalInvalid = batches.reduce((acc, b) => acc + b.invalid, 0);

  const tableHtml = `<table>
    <thead><tr><th>Batch</th><th>Received</th><th>Invalid</th><th>Status</th></tr></thead>
    <tbody>${batches
      .map(
        (b, i) =>
          `<tr><td>${i + 1}</td><td>${b.count}</td><td>${b.invalid}</td><td>${b.ok ? '<span class="text-emerald-400">✓</span>' : `<span class="text-rose-400">✗ ${b.error}</span>`}</td></tr>`,
      )
      .join('')}</tbody></table>`;

  const summaryHtml = `<div class="grid grid-cols-3 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Audience ID</div><div class="font-mono text-emerald-300 mt-1">${audienceId}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Total received</div><div class="text-2xl font-bold mt-1">${totalReceived}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Total invalid</div><div class="text-2xl font-bold mt-1 text-rose-300">${totalInvalid}</div></div>
  </div>`;

  const htmlPath = await writeReport(
    {
      title: 'Meta Ads — Custom Audience Upload',
      subtitle: opts.audienceName,
      platform: 'meta',
      skill: 'audience-builder',
      accountRef: opts.accountRef,
      sections: [
        { heading: 'Summary', html: summaryHtml },
        { heading: 'Batches', html: tableHtml },
      ],
    },
    opts.reportsDir,
  );

  const mdPath = await writeMarkdownReport(
    {
      title: 'Meta Ads — Custom Audience Upload',
      platform: 'meta',
      skill: 'audience-builder',
      summary: `Audience \`${audienceId}\` — **${totalReceived}** received, **${totalInvalid}** invalid across ${batches.length} batches.`,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Done — audience ${audienceId}`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
