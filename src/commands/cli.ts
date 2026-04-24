#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import prompts from 'prompts';
import { resolve } from 'node:path';
import { runInit } from './init.js';
import { runMetaUpload } from './meta-upload.js';
import { runMetaAudienceUpload } from './meta-audience.js';
import { runMetaFatigue } from './meta-fatigue.js';
import { runMetaSpend } from './meta-spend.js';

const program = new Command();
program
  .name('adskills')
  .description('Claude Code Skills framework for multi-platform ad ops')
  .version('0.1.0');

program
  .command('init')
  .description('Set up OAuth and token storage')
  .action(async () => {
    await runInit();
  });

const meta = program.command('meta').description('Meta (Facebook/Instagram) Ads operations');

meta
  .command('upload')
  .description('Bulk upload creatives from a local folder')
  .requiredOption('-a, --account <ref>', 'account reference (key in config/accounts.json)')
  .requiredOption('-f, --folder <path>', 'local folder with creatives')
  .requiredOption('--adset <id>', 'target ad set id')
  .requiredOption('--page <id>', 'facebook page id')
  .requiredOption('--link <url>', 'destination URL')
  .option('--cta <type>', 'call-to-action (e.g., LEARN_MORE, SIGN_UP)', 'LEARN_MORE')
  .option('--primary-text <text>', 'primary text applied to all creatives')
  .option('--headline <text>', 'headline applied to all creatives')
  .option('--status <status>', 'PAUSED | ACTIVE', 'PAUSED')
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .option('--dry-run', 'simulate without hitting Meta API')
  .action(async (options) => {
    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Token store password',
    });
    if (!password) {
      console.error('Password required');
      process.exit(1);
    }
    await runMetaUpload({
      accountRef: options.account,
      folder: options.folder,
      adSetId: options.adset,
      pageId: options.page,
      linkUrl: options.link,
      cta: options.cta,
      primaryText: options.primaryText,
      headline: options.headline,
      status: options.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
      dryRun: Boolean(options.dryRun),
    });
  });

meta
  .command('audience')
  .description('Upload a CSV as a Meta custom audience (SHA-256 hashed)')
  .requiredOption('-a, --account <ref>', 'account reference')
  .requiredOption('--csv <path>', 'CSV file with PII columns')
  .requiredOption('--name <name>', 'audience name')
  .option('--description <text>', 'audience description')
  .option('--batch-size <n>', 'rows per API call', (v) => Number(v), 5000)
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .option('--dry-run', 'simulate without hitting Meta API')
  .action(async (options) => {
    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Token store password',
    });
    if (!password) {
      console.error('Password required');
      process.exit(1);
    }
    await runMetaAudienceUpload({
      accountRef: options.account,
      csvPath: options.csv,
      audienceName: options.name,
      description: options.description,
      batchSize: options.batchSize,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
      dryRun: Boolean(options.dryRun),
    });
  });

meta
  .command('fatigue')
  .description('Detect creative fatigue (CTR decay, frequency cap breach)')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--adset <id>', 'scope to a single ad set')
  .option('--lookback <days>', 'lookback window in days', (v) => Number(v), 7)
  .option('--ctr-drop <pct>', 'CTR drop threshold %', (v) => Number(v), 20)
  .option('--frequency <n>', 'frequency cap', (v) => Number(v), 3.5)
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--thresholds <path>', 'path to thresholds.json', 'config/thresholds.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Token store password',
    });
    if (!password) process.exit(1);
    await runMetaFatigue({
      accountRef: options.account,
      adSetId: options.adset,
      ctrDropPct: options.ctrDrop,
      frequencyCap: options.frequency,
      lookbackDays: options.lookback,
      password,
      configPath: resolve(options.config),
      thresholdsPath: resolve(options.thresholds),
      reportsDir: resolve(options.reports),
    });
  });

meta
  .command('spend')
  .description('Track monthly spend pacing vs budget')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--budget <amount>', 'monthly budget in account currency', (v) => Number(v))
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--thresholds <path>', 'path to thresholds.json', 'config/thresholds.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Token store password',
    });
    if (!password) process.exit(1);
    await runMetaSpend({
      accountRef: options.account,
      monthlyBudget: options.budget,
      password,
      configPath: resolve(options.config),
      thresholdsPath: resolve(options.thresholds),
      reportsDir: resolve(options.reports),
    });
  });

program.parseAsync().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\x1b[31merror:\x1b[0m ${msg}`);
  process.exit(1);
});
