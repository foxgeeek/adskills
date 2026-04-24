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
import { runGoogleAudit } from './google-audit.js';
import { runGoogleKeywords } from './google-keywords.js';
import { runGoogleSearchTerms } from './google-search-terms.js';
import { runGoogleNegatives } from './google-negatives.js';
import { runLinkedInAudienceUpload } from './linkedin-audience.js';
import { runLinkedInBidOptimizer } from './linkedin-bids.js';
import { runLinkedInBulkEdit } from './linkedin-bulk.js';
import { runLinkedInCreativeStrategist } from './linkedin-creative.js';

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

const google = program.command('google').description('Google Ads operations');

async function getGooglePassword(): Promise<string> {
  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Token store password',
  });
  if (!password) process.exit(1);
  return password;
}

google
  .command('audit')
  .description('Performance audit — current vs previous period')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--lookback <days>', 'lookback window in days', (v) => Number(v), 30)
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const password = await getGooglePassword();
    await runGoogleAudit({
      accountRef: options.account,
      lookbackDays: options.lookback,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
    });
  });

google
  .command('keywords')
  .description('Keyword analysis — quality score, impression share, CPC')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--campaign <id>', 'scope to campaign')
  .option('--lookback <days>', 'lookback window in days', (v) => Number(v), 30)
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const password = await getGooglePassword();
    await runGoogleKeywords({
      accountRef: options.account,
      campaignId: options.campaign,
      lookbackDays: options.lookback,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
    });
  });

google
  .command('search-terms')
  .description('Search term report with intent classification')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--campaign <id>', 'scope to campaign')
  .option('--lookback <days>', 'lookback window', (v) => Number(v), 30)
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const password = await getGooglePassword();
    await runGoogleSearchTerms({
      accountRef: options.account,
      campaignId: options.campaign,
      lookbackDays: options.lookback,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
    });
  });

google
  .command('negatives')
  .description('Mine negative keyword candidates from search terms')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--campaign <id>', 'scope to campaign')
  .option('--lookback <days>', 'lookback window', (v) => Number(v), 30)
  .option('--min-impressions <n>', 'min impressions to consider', (v) => Number(v), 50)
  .option('--max-ctr <pct>', 'max CTR %', (v) => Number(v), 1.0)
  .option('--min-spend <amount>', 'min spend to consider', (v) => Number(v), 5)
  .option('--apply', 'add negatives to ad group (requires --ad-group)')
  .option('--ad-group <resource>', 'ad group resource name for --apply')
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const password = await getGooglePassword();
    await runGoogleNegatives({
      accountRef: options.account,
      campaignId: options.campaign,
      lookbackDays: options.lookback,
      minImpressions: options.minImpressions,
      maxCtrPct: options.maxCtr,
      minSpend: options.minSpend,
      apply: Boolean(options.apply),
      adGroupResourceName: options.adGroup,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
    });
  });

const linkedin = program.command('linkedin').description('LinkedIn Ads operations');

async function getLinkedInPassword(): Promise<string> {
  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Token store password',
  });
  if (!password) process.exit(1);
  return password;
}

linkedin
  .command('audience')
  .description('Upload CSV as LinkedIn DMP segment (ABM contacts or companies)')
  .requiredOption('-a, --account <ref>', 'account reference')
  .requiredOption('--csv <path>', 'CSV file')
  .requiredOption('--name <name>', 'audience name')
  .option('--type <type>', 'USER | COMPANY', 'USER')
  .option('--description <text>', 'audience description')
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .option('--dry-run', 'simulate without hitting LinkedIn API')
  .action(async (options) => {
    const password = await getLinkedInPassword();
    await runLinkedInAudienceUpload({
      accountRef: options.account,
      csvPath: options.csv,
      audienceName: options.name,
      description: options.description,
      sourceType: options.type === 'COMPANY' ? 'COMPANY' : 'USER',
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
      dryRun: Boolean(options.dryRun),
    });
  });

linkedin
  .command('bids')
  .description('Analyze CTR + conv and suggest bid adjustments (optional --apply)')
  .requiredOption('-a, --account <ref>', 'account reference')
  .option('--lookback <days>', 'lookback window', (v) => Number(v), 14)
  .option('--min-ctr <pct>', 'min CTR % to suggest raise', (v) => Number(v), 0.4)
  .option('--max-cpc-raise-ratio <n>', 'CPC/bid ratio above which to lower bid', (v) => Number(v), 0.9)
  .option('--adjust <pct>', 'bid adjustment %', (v) => Number(v), 15)
  .option('--apply', 'apply suggestions (prompts for confirmation)')
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const password = await getLinkedInPassword();
    await runLinkedInBidOptimizer({
      accountRef: options.account,
      lookbackDays: options.lookback,
      minCtrPct: options.minCtr,
      maxCpcRaiseRatio: options.maxCpcRaiseRatio,
      adjustPct: options.adjust,
      apply: Boolean(options.apply),
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
    });
  });

linkedin
  .command('bulk')
  .description('Bulk edit campaigns from CSV (columns: campaign_id, status, daily_budget, unit_cost)')
  .requiredOption('-a, --account <ref>', 'account reference')
  .requiredOption('--csv <path>', 'CSV with edits')
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .option('--dry-run', 'simulate without hitting LinkedIn API')
  .action(async (options) => {
    const password = await getLinkedInPassword();
    await runLinkedInBulkEdit({
      accountRef: options.account,
      csvPath: options.csv,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
      dryRun: Boolean(options.dryRun),
    });
  });

linkedin
  .command('creatives')
  .description('Analyze creative format performance and suggest next tests')
  .requiredOption('-a, --account <ref>', 'account reference')
  .requiredOption('--campaign <id>', 'campaign id')
  .option('--lookback <days>', 'lookback window', (v) => Number(v), 30)
  .option('--config <path>', 'path to accounts.json', 'config/accounts.json')
  .option('--reports <path>', 'reports output dir', 'reports')
  .action(async (options) => {
    const password = await getLinkedInPassword();
    await runLinkedInCreativeStrategist({
      accountRef: options.account,
      campaignId: options.campaign,
      lookbackDays: options.lookback,
      password,
      configPath: resolve(options.config),
      reportsDir: resolve(options.reports),
    });
  });

program.parseAsync().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\x1b[31merror:\x1b[0m ${msg}`);
  process.exit(1);
});
