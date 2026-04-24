import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { LinkedInClient } from '../clients/linkedin.js';
import { getToken } from '../core/auth.js';
import { parseCsv } from '../utils/csv-parser.js';
import { hashEmail } from '../utils/hash-pii.js';
import { writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface LinkedInAudienceOptions {
  accountRef: string;
  csvPath: string;
  audienceName: string;
  description?: string;
  sourceType: 'USER' | 'COMPANY';
  password: string;
  configPath: string;
  reportsDir: string;
  dryRun?: boolean;
}

interface AccountsFile {
  [key: string]: { linkedin?: { accountId: string; tokenRef: string } };
}

export async function runLinkedInAudienceUpload(opts: LinkedInAudienceOptions): Promise<void> {
  const accounts = JSON.parse(await readFile(opts.configPath, 'utf8')) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.linkedin) throw new Error(`Account "${opts.accountRef}" missing linkedin config`);
  const token = await getToken(account.linkedin.tokenRef, opts.password);
  if (!token) throw new Error(`No token for ${account.linkedin.tokenRef}`);

  const rows = await parseCsv(resolve(opts.csvPath));
  if (rows.length === 0) throw new Error('CSV is empty');

  const users = rows
    .map((r) => {
      const rawEmail = r.email ?? r.e_mail ?? r.mail ?? '';
      const email = rawEmail ? hashEmail(rawEmail) : undefined;
      return {
        email: email ?? undefined,
        firstName: r.first_name ?? r.nome ?? r.firstname,
        lastName: r.last_name ?? r.sobrenome ?? r.lastname,
        company: r.company ?? r.empresa ?? r.organization,
      };
    })
    .filter((u) => (opts.sourceType === 'COMPANY' ? u.company : u.email));

  console.log(kleur.bold().cyan('\nAudience preview:'));
  console.log(`  CSV rows:        ${rows.length}`);
  console.log(`  Valid entries:   ${users.length}`);
  console.log(`  Source type:     ${opts.sourceType}`);
  console.log(`  Audience name:   ${opts.audienceName}`);

  if (!opts.dryRun) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Create DMP segment and upload ${users.length} entries?`,
      initial: false,
    });
    if (!confirmed) return;
  }

  const client = new LinkedInClient({
    accessToken: token.accessToken,
    accountId: account.linkedin.accountId,
  });

  let segmentId = 'dry-run';
  let submitted = 0;

  if (!opts.dryRun) {
    const spin = ora(`Creating DMP segment "${opts.audienceName}"`).start();
    try {
      const seg = await client.createDmpSegment({
        name: opts.audienceName,
        description: opts.description ?? `Uploaded from ${opts.csvPath}`,
        sourceType: opts.sourceType,
      });
      segmentId = seg.id;
      spin.succeed(`Segment created: ${segmentId}`);
    } catch (err) {
      spin.fail(err instanceof Error ? err.message : String(err));
      throw err;
    }

    const upSpin = ora('Uploading users').start();
    try {
      const r = await client.uploadSegmentUsers(segmentId, users);
      submitted = r.submitted;
      upSpin.succeed(`Submitted ${submitted} entries`);
    } catch (err) {
      upSpin.fail(err instanceof Error ? err.message : String(err));
    }
  } else {
    submitted = users.length;
  }

  const summaryHtml = `<div class="grid grid-cols-3 gap-4">
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Segment ID</div><div class="font-mono text-emerald-300 mt-1">${segmentId}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Submitted</div><div class="text-2xl font-bold mt-1">${submitted}</div></div>
    <div class="card rounded-lg p-4"><div class="text-xs text-slate-400">Source type</div><div class="text-xl mt-1">${opts.sourceType}</div></div>
  </div>`;

  const htmlPath = await writeReport(
    {
      title: 'LinkedIn Ads — Audience Upload',
      subtitle: opts.audienceName,
      platform: 'linkedin',
      skill: 'audience-builder',
      accountRef: opts.accountRef,
      sections: [{ heading: 'Summary', html: summaryHtml }],
    },
    opts.reportsDir,
  );
  const mdPath = await writeMarkdownReport(
    {
      title: 'LinkedIn Ads — Audience Upload',
      platform: 'linkedin',
      skill: 'audience-builder',
      summary: `Segment \`${segmentId}\` · ${submitted} entries submitted · source ${opts.sourceType}`,
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Done — segment ${segmentId}`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
