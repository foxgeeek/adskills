import 'dotenv/config';
import prompts from 'prompts';
import kleur from 'kleur';
import { runMetaOAuth } from '../core/oauth-meta.js';
import { runGoogleOAuth } from '../core/oauth-google.js';
import { runLinkedInOAuth } from '../core/oauth-linkedin.js';
import { putToken } from '../core/auth.js';
import { logger } from '../core/logger.js';

export async function runInit(): Promise<void> {
  console.log(kleur.bold().cyan('AdSkills — initial setup\n'));

  const { platform } = await prompts({
    type: 'select',
    name: 'platform',
    message: 'Which platform to authenticate?',
    choices: [
      { title: 'Meta (Facebook/Instagram)', value: 'meta' },
      { title: 'Google Ads', value: 'google' },
      { title: 'LinkedIn Ads', value: 'linkedin' },
    ],
  });

  if (platform === 'meta') return setupMeta();
  if (platform === 'google') return setupGoogle();
  if (platform === 'linkedin') return setupLinkedIn();
}

async function setupLinkedIn(): Promise<void> {
  const { accountRef } = await prompts({
    type: 'text',
    name: 'accountRef',
    message: 'Account reference key (e.g. "coldiq")',
    validate: (v: string) => (/^[a-z0-9][a-z0-9_-]*$/i.test(v) ? true : 'alphanumeric, dash, underscore'),
  });
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI ?? 'http://localhost:3000/oauth/linkedin/callback';
  const port = Number(process.env.OAUTH_CALLBACK_PORT ?? '3000');
  if (!clientId || !clientSecret) {
    throw new Error('Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env');
  }

  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Password to encrypt the token store',
    validate: (v: string) => (v.length >= 8 ? true : 'min 8 chars'),
  });

  const oauth = await runLinkedInOAuth({ clientId, clientSecret, redirectUri, port });
  logger.info('LinkedIn OAuth successful');
  await putToken(
    {
      platform: 'linkedin',
      accountRef,
      accessToken: oauth.accessToken,
      refreshToken: oauth.refreshToken,
      expiresAt: Date.now() + oauth.expiresIn * 1000,
      scope: oauth.scope,
      createdAt: Date.now(),
    },
    password,
  );
  console.log(kleur.green(`\n✓ Token stored as linkedin.${accountRef}`));
  console.log(kleur.gray(`  Add accountId (urn:li:sponsoredAccount:XXX) to config/accounts.json`));
}

async function setupMeta(): Promise<void> {
  const { accountRef } = await prompts({
    type: 'text',
    name: 'accountRef',
    message: 'Account reference key (e.g. "coldiq")',
    validate: (v: string) => (/^[a-z0-9][a-z0-9_-]*$/i.test(v) ? true : 'alphanumeric, dash, underscore'),
  });
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI ?? 'http://localhost:3000/oauth/meta/callback';
  const port = Number(process.env.OAUTH_CALLBACK_PORT ?? '3000');
  if (!appId || !appSecret) throw new Error('Set META_APP_ID and META_APP_SECRET in .env');

  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Password to encrypt the token store (remember this)',
    validate: (v: string) => (v.length >= 8 ? true : 'min 8 chars'),
  });

  const oauth = await runMetaOAuth({ appId, appSecret, redirectUri, port });
  logger.info('Meta OAuth successful');
  await putToken(
    {
      platform: 'meta',
      accountRef,
      accessToken: oauth.longLivedToken,
      expiresAt: Date.now() + oauth.longLivedExpiresIn * 1000,
      createdAt: Date.now(),
    },
    password,
  );
  console.log(kleur.green(`\n✓ Token stored as meta.${accountRef}`));
}

async function setupGoogle(): Promise<void> {
  const { accountRef } = await prompts({
    type: 'text',
    name: 'accountRef',
    message: 'Account reference key (e.g. "coldiq")',
    validate: (v: string) => (/^[a-z0-9][a-z0-9_-]*$/i.test(v) ? true : 'alphanumeric, dash, underscore'),
  });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/oauth/google/callback';
  const port = Number(process.env.OAUTH_CALLBACK_PORT ?? '3000');
  if (!clientId || !clientSecret || !developerToken) {
    throw new Error('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_DEVELOPER_TOKEN in .env');
  }

  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Password to encrypt the token store (remember this)',
    validate: (v: string) => (v.length >= 8 ? true : 'min 8 chars'),
  });

  const oauth = await runGoogleOAuth({ clientId, clientSecret, redirectUri, port });
  logger.info('Google OAuth successful');
  await putToken(
    {
      platform: 'google',
      accountRef,
      accessToken: oauth.accessToken,
      refreshToken: oauth.refreshToken,
      expiresAt: Date.now() + oauth.expiresIn * 1000,
      scope: oauth.scope,
      createdAt: Date.now(),
    },
    password,
  );
  console.log(kleur.green(`\n✓ Token stored as google.${accountRef}`));
  console.log(kleur.gray(`  Remember to add customerId + loginCustomerId to config/accounts.json`));
}
