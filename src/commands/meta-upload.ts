import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import kleur from 'kleur';
import ora from 'ora';
import prompts from 'prompts';
import { MetaClient } from '../clients/meta.js';
import { getToken } from '../core/auth.js';
import { logger } from '../core/logger.js';
import { scanCreativeFolder } from '../utils/scan-folder.js';
import { downloadDriveFolder } from '../utils/drive-fetcher.js';
import { renderCreativeTable, writeReport } from '../reporters/html-report.js';
import { writeMarkdownReport } from '../reporters/markdown-report.js';

export interface MetaUploadOptions {
  accountRef: string;
  folder?: string;
  driveFolder?: string;
  driveTokenRef?: string;
  adSetId: string;
  pageId: string;
  linkUrl: string;
  cta?: string;
  primaryText?: string;
  headline?: string;
  status?: 'PAUSED' | 'ACTIVE';
  password: string;
  reportsDir: string;
  configPath: string;
  dryRun?: boolean;
}

interface AccountsFile {
  [key: string]: {
    label?: string;
    meta?: { adAccountId: string; tokenRef: string };
  };
}

export async function runMetaUpload(opts: MetaUploadOptions): Promise<void> {
  const accountsRaw = await readFile(opts.configPath, 'utf8');
  const accounts = JSON.parse(accountsRaw) as AccountsFile;
  const account = accounts[opts.accountRef];
  if (!account?.meta) {
    throw new Error(`Account "${opts.accountRef}" not found or missing meta config`);
  }

  const token = await getToken(account.meta.tokenRef, opts.password);
  if (!token) {
    throw new Error(`No token for ${account.meta.tokenRef} — run "adskills init" first`);
  }

  let sourceFolder = opts.folder ? resolve(opts.folder) : undefined;
  if (opts.driveFolder) {
    const driveTokenRef = opts.driveTokenRef ?? `google.${opts.accountRef}`;
    const driveToken = await getToken(driveTokenRef, opts.password);
    if (!driveToken) {
      throw new Error(
        `Drive download requires Google token at ${driveTokenRef}. Run "adskills init" → Google first.`,
      );
    }
    logger.info(`Fetching Drive folder to temp dir`);
    const downloaded = await downloadDriveFolder(opts.driveFolder, driveToken.accessToken);
    sourceFolder = downloaded.dir;
    logger.info(`Downloaded ${downloaded.files.length} files to ${sourceFolder}`);
  }
  if (!sourceFolder) throw new Error('Provide --folder or --drive-folder');

  const assets = await scanCreativeFolder(sourceFolder);
  if (assets.length === 0) {
    logger.warn('No supported assets found (jpg, png, mp4)');
    return;
  }
  if (assets.length > 50) {
    throw new Error(`Folder has ${assets.length} assets — max 50 per invocation`);
  }

  console.log(kleur.bold().cyan('\nAssets to upload:'));
  for (const a of assets) {
    console.log(`  ${kleur.gray('•')} ${a.name} ${kleur.gray(`(${a.mimeType}, ${(a.sizeBytes / 1024).toFixed(0)} KB)`)}`);
  }
  console.log(
    kleur.gray(
      `\naccount=${opts.accountRef} adAccountId=${account.meta.adAccountId} adSetId=${opts.adSetId}`,
    ),
  );

  if (opts.status === 'ACTIVE') {
    console.log(kleur.yellow().bold('\n⚠ ACTIVE status requested — ads will go live immediately.'));
  }

  if (!opts.dryRun) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Proceed uploading ${assets.length} creatives?`,
      initial: false,
    });
    if (!confirmed) {
      logger.info('Aborted by user');
      return;
    }
  }

  const client = new MetaClient({
    accessToken: token.accessToken,
    adAccountId: account.meta.adAccountId,
  });

  const results: Array<{
    name: string;
    file: string;
    sizeKb: number;
    imageHash?: string;
    creativeId?: string;
    adId?: string;
    status: 'ok' | 'failed';
    error?: string;
  }> = [];

  for (const asset of assets) {
    const spinner = ora(`Uploading ${asset.name}`).start();
    const record = {
      name: asset.name,
      file: asset.path,
      sizeKb: asset.sizeBytes / 1024,
      status: 'ok' as 'ok' | 'failed',
    } as (typeof results)[number];
    try {
      if (asset.mimeType === 'video/mp4') {
        throw new Error('Video upload not yet implemented (Phase 2)');
      }
      if (opts.dryRun) {
        record.imageHash = 'dry-run';
        record.creativeId = 'dry-run';
        record.adId = 'dry-run';
        spinner.succeed(`${asset.name} — dry run`);
      } else {
        const img = await client.uploadImage(asset.path);
        record.imageHash = img.hash;
        const creative = await client.createAdCreative(
          {
            name: asset.name,
            filePath: asset.path,
            mimeType: asset.mimeType,
            linkUrl: opts.linkUrl,
            primaryText: opts.primaryText,
            headline: opts.headline,
            callToAction: opts.cta,
          },
          img.hash,
          opts.pageId,
        );
        record.creativeId = creative.adCreativeId;
        const ad = await client.createAd(
          opts.adSetId,
          creative.adCreativeId!,
          asset.name,
          opts.status ?? 'PAUSED',
        );
        record.adId = ad.id;
        spinner.succeed(`${asset.name} — ad ${ad.id}`);
      }
    } catch (err) {
      record.status = 'failed';
      record.error = err instanceof Error ? err.message : String(err);
      spinner.fail(`${asset.name} — ${record.error}`);
    }
    results.push(record);
  }

  const ok = results.filter((r) => r.status === 'ok').length;
  const failed = results.length - ok;

  const htmlPath = await writeReport(
    {
      title: `Meta Ads — Bulk Creative Upload`,
      subtitle: `${ok} ok · ${failed} failed · ad set ${opts.adSetId}`,
      platform: 'meta',
      skill: 'creative-strategy',
      accountRef: opts.accountRef,
      sections: [
        { heading: 'Uploaded creatives', html: renderCreativeTable(results) },
      ],
    },
    opts.reportsDir,
  );

  const mdPath = await writeMarkdownReport(
    {
      title: 'Meta Ads — Bulk Creative Upload',
      platform: 'meta',
      skill: 'creative-strategy',
      summary: `**${ok}** uploaded · **${failed}** failed · ad set \`${opts.adSetId}\` · account \`${opts.accountRef}\``,
      table: {
        headers: ['Name', 'Status', 'Creative ID', 'Ad ID'],
        rows: results.map((r) => [
          r.name,
          r.status === 'ok' ? '✓' : `✗ ${r.error ?? ''}`,
          r.creativeId ?? '—',
          r.adId ?? '—',
        ]),
      },
    },
    opts.reportsDir,
  );

  console.log(kleur.bold().green(`\n✓ Done — ${ok} ok, ${failed} failed`));
  console.log(kleur.gray(`HTML:     ${htmlPath}`));
  console.log(kleur.gray(`Markdown: ${mdPath}`));
}
