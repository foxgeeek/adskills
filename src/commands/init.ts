import 'dotenv/config';
import prompts from 'prompts';
import kleur from 'kleur';
import { runMetaOAuth } from '../core/oauth-meta.js';
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
      { title: 'Google Ads (Phase 3 — not yet available)', value: 'google', disabled: true },
      { title: 'LinkedIn (Phase 4 — not yet available)', value: 'linkedin', disabled: true },
    ],
  });

  if (platform !== 'meta') {
    console.log(kleur.yellow('Only Meta OAuth is implemented in Phase 1.'));
    return;
  }

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

  if (!appId || !appSecret) {
    throw new Error('Set META_APP_ID and META_APP_SECRET in .env first');
  }

  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Password to encrypt the token store (remember this)',
    validate: (v: string) => (v.length >= 8 ? true : 'min 8 chars'),
  });

  const oauth = await runMetaOAuth({ appId, appSecret, redirectUri, port });
  logger.info('OAuth successful');

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
  console.log(kleur.gray(`  Add this accountRef to config/accounts.json before running commands.`));
}
