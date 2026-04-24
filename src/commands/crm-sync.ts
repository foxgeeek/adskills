import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { MetaClient } from '../clients/meta.js';
import { GoogleAdsClient } from '../clients/google.js';
import { LinkedInClient } from '../clients/linkedin.js';
import { getToken } from '../core/auth.js';
import { parseCsv } from '../utils/csv-parser.js';
import { hashEmail, hashPhone } from '../utils/hash-pii.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface CrmSyncOptions {
  accountRef: string;
  csvPath: string;
  audienceName: string;
  description?: string;
  platforms: Array<'meta' | 'google' | 'linkedin'>;
  password: string;
  configPath: string;
  reportsDir: string;
  dryRun?: boolean;
}

interface AccountsFile {
  [key: string]: {
    meta?: { adAccountId: string; tokenRef: string };
    google?: { customerId: string; loginCustomerId?: string; tokenRef: string };
    linkedin?: { accountId: string; tokenRef: string };
  };
}

interface PlatformResult {
  platform: string;
  ok: boolean;
  audienceId?: string;
  submitted?: number;
  error?: string;
}

export async function runCrmSync(opts: CrmSyncOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account) throw new Error(`Account "${opts.accountRef}" not found`);

  const rows = await parseCsv(resolve(opts.csvPath));
  if (rows.length === 0) throw new Error('CSV is empty');

  const records = rows.map((r) => {
    const rawEmail = r.email ?? r.e_mail ?? r.mail ?? '';
    const rawPhone = r.phone ?? r.telefone ?? r.celular ?? r.whatsapp ?? '';
    return {
      email: rawEmail || undefined,
      phone: rawPhone || undefined,
      firstName: r.first_name ?? r.nome ?? r.firstname,
      lastName: r.last_name ?? r.sobrenome ?? r.lastname,
      company: r.company ?? r.empresa,
    };
  });

  console.log(kleur.bold().cyan('\nCross-platform CRM sync:'));
  console.log(`  CSV rows:        ${rows.length}`);
  console.log(`  Target platforms: ${opts.platforms.join(', ')}`);
  console.log(`  Audience name:    ${opts.audienceName}`);
  console.log(`  Account:          ${opts.accountRef}`);

  if (!opts.dryRun) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Sync ${rows.length} records to ${opts.platforms.length} platform(s)?`,
      initial: false,
    });
    if (!confirmed) return;
  }

  const results: PlatformResult[] = [];

  if (opts.platforms.includes('meta')) {
    results.push(await syncMeta(account, opts, records));
  }
  if (opts.platforms.includes('google')) {
    results.push(await syncGoogle(account, opts, records));
  }
  if (opts.platforms.includes('linkedin')) {
    results.push(await syncLinkedIn(account, opts, records));
  }

  const tableHtml = `<table>
    <thead><tr><th>Platform</th><th>Audience ID</th><th>Submitted</th><th>Status</th></tr></thead>
    <tbody>${results
      .map(
        (r) => `<tr>
          <td class="font-semibold">${r.platform}</td>
          <td><code>${r.audienceId ?? '—'}</code></td>
          <td>${r.submitted ?? 0}</td>
          <td>${r.ok ? '<span class="text-emerald-400">✓ ok</span>' : `<span class="text-rose-400">✗ ${r.error}</span>`}</td>
        </tr>`,
      )
      .join('')}</tbody></table>`;

  const htmlPath = await writeReport(
    {
      title: 'Cross-Platform — CRM Audience Sync',
      subtitle: opts.audienceName,
      platform: 'cross',
      skill: 'crm-sync',
      accountRef: opts.accountRef,
      sections: [{ heading: 'Results per platform', html: tableHtml }],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'Cross-Platform — CRM Sync',
      platform: 'cross',
      skill: 'crm-sync',
      summary: `**${opts.audienceName}** · ${results.filter((r) => r.ok).length} / ${results.length} platforms synced`,
      table: {
        headers: ['Platform', 'Audience ID', 'Submitted', 'Status'],
        rows: results.map((r) => [
          r.platform,
          r.audienceId ?? '—',
          String(r.submitted ?? 0),
          r.ok ? '✓' : `✗ ${r.error ?? ''}`,
        ]),
      },
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Synced to ${results.filter((r) => r.ok).length} / ${results.length} platforms`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}

async function syncMeta(
  account: AccountsFile[string],
  opts: CrmSyncOptions,
  records: Array<{ email?: string; phone?: string; firstName?: string; lastName?: string }>,
): Promise<PlatformResult> {
  if (!account.meta) return { platform: 'meta', ok: false, error: 'no meta config' };
  const spin = ora('Meta: creating audience').start();
  try {
    const token = await getToken(account.meta.tokenRef, opts.password);
    if (!token) throw new Error('no token');
    const client = new MetaClient({ accessToken: token.accessToken, adAccountId: account.meta.adAccountId });

    if (opts.dryRun) {
      spin.succeed(`Meta: dry run (${records.length} records)`);
      return { platform: 'meta', ok: true, audienceId: 'dry-run', submitted: records.length };
    }

    const audience = await client.createCustomAudience(opts.audienceName, opts.description ?? '');
    const schema: Array<'EMAIL' | 'PHONE'> = [];
    if (records.some((r) => r.email)) schema.push('EMAIL');
    if (records.some((r) => r.phone)) schema.push('PHONE');
    const hashed = records
      .map((r) => schema.map((f) => (f === 'EMAIL' ? hashEmail(r.email ?? '') : hashPhone(r.phone ?? '')) ?? ''))
      .filter((row) => row.some((c) => c !== ''));

    const resp = await client.addUsersToAudience(audience.id, schema, hashed);
    spin.succeed(`Meta: audience ${audience.id} · ${resp.num_received} received`);
    return { platform: 'meta', ok: true, audienceId: audience.id, submitted: resp.num_received };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spin.fail(`Meta: ${msg}`);
    return { platform: 'meta', ok: false, error: msg };
  }
}

async function syncGoogle(
  account: AccountsFile[string],
  opts: CrmSyncOptions,
  records: Array<{ email?: string; phone?: string }>,
): Promise<PlatformResult> {
  if (!account.google) return { platform: 'google', ok: false, error: 'no google config' };
  const spin = ora('Google: creating user list').start();
  try {
    const token = await getToken(account.google.tokenRef, opts.password);
    if (!token?.refreshToken) throw new Error('no refresh token');
    const client = new GoogleAdsClient({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      developerToken: process.env.GOOGLE_DEVELOPER_TOKEN!,
      refreshToken: token.refreshToken,
      customerId: account.google.customerId,
      loginCustomerId: account.google.loginCustomerId,
    });

    if (opts.dryRun) {
      spin.succeed(`Google: dry run (${records.length} records)`);
      return { platform: 'google', ok: true, audienceId: 'dry-run', submitted: records.length };
    }

    const list = await client.createUserList(opts.audienceName, opts.description ?? '');
    const hashed = records
      .map((r) => ({
        email: r.email ? hashEmail(r.email) ?? undefined : undefined,
        phone: r.phone ? hashPhone(r.phone) ?? undefined : undefined,
      }))
      .filter((u) => u.email || u.phone);

    const resp = await client.addUsersToUserList(list.resourceName, hashed);
    spin.succeed(`Google: list ${list.resourceName} · ${resp.submitted} submitted`);
    return { platform: 'google', ok: true, audienceId: list.resourceName, submitted: resp.submitted };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spin.fail(`Google: ${msg}`);
    return { platform: 'google', ok: false, error: msg };
  }
}

async function syncLinkedIn(
  account: AccountsFile[string],
  opts: CrmSyncOptions,
  records: Array<{ email?: string; firstName?: string; lastName?: string; company?: string }>,
): Promise<PlatformResult> {
  if (!account.linkedin) return { platform: 'linkedin', ok: false, error: 'no linkedin config' };
  const spin = ora('LinkedIn: creating segment').start();
  try {
    const token = await getToken(account.linkedin.tokenRef, opts.password);
    if (!token) throw new Error('no token');
    const client = new LinkedInClient({ accessToken: token.accessToken, accountId: account.linkedin.accountId });

    if (opts.dryRun) {
      spin.succeed(`LinkedIn: dry run (${records.length} records)`);
      return { platform: 'linkedin', ok: true, audienceId: 'dry-run', submitted: records.length };
    }

    const segment = await client.createDmpSegment({
      name: opts.audienceName,
      description: opts.description ?? '',
      sourceType: 'USER',
    });
    const users = records
      .filter((r) => r.email)
      .map((r) => ({
        email: hashEmail(r.email!) ?? undefined,
        firstName: r.firstName,
        lastName: r.lastName,
        company: r.company,
      }));
    const resp = await client.uploadSegmentUsers(segment.id, users);
    spin.succeed(`LinkedIn: segment ${segment.id} · ${resp.submitted} submitted`);
    return { platform: 'linkedin', ok: true, audienceId: segment.id, submitted: resp.submitted };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    spin.fail(`LinkedIn: ${msg}`);
    return { platform: 'linkedin', ok: false, error: msg };
  }
}
