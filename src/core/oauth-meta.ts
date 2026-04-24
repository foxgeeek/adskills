import { createServer } from 'node:http';
import { request } from 'undici';
import open from 'open';
import { logger } from './logger.js';

export interface MetaOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  port: number;
  scopes?: string[];
}

export interface MetaOAuthResult {
  accessToken: string;
  expiresIn: number;
  longLivedToken: string;
  longLivedExpiresIn: number;
}

const DEFAULT_SCOPES = [
  'ads_management',
  'ads_read',
  'business_management',
  'pages_read_engagement',
  'pages_manage_ads',
];

export async function runMetaOAuth(config: MetaOAuthConfig): Promise<MetaOAuthResult> {
  const scopes = config.scopes ?? DEFAULT_SCOPES;
  const state = Math.random().toString(36).slice(2);

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', config.appId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', scopes.join(','));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  const code = await captureCode(config.port, state);
  logger.debug(`Captured OAuth code`);

  const shortToken = await exchangeCodeForToken(code, config);
  const longToken = await exchangeForLongLived(shortToken.accessToken, config);

  return {
    accessToken: shortToken.accessToken,
    expiresIn: shortToken.expiresIn,
    longLivedToken: longToken.accessToken,
    longLivedExpiresIn: longToken.expiresIn,
  };

  async function captureCode(port: number, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);
        if (!url.pathname.startsWith('/oauth/meta/callback')) {
          res.writeHead(404).end();
          return;
        }
        const returnedCode = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error_description');
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(
          error
            ? `<h1>Auth failed</h1><p>${error}</p>`
            : `<h1>AdSkills — Meta OAuth OK</h1><p>You can close this tab.</p>`,
        );
        server.close();
        if (error) return reject(new Error(error));
        if (!returnedCode) return reject(new Error('Missing code in callback'));
        if (returnedState !== expectedState) return reject(new Error('State mismatch'));
        resolve(returnedCode);
      });
      server.listen(port, () => {
        logger.info(`Opening browser for Meta OAuth at port ${port}`);
        open(authUrl.toString()).catch(() => {
          logger.warn(`Could not auto-open browser. Visit: ${authUrl.toString()}`);
        });
      });
    });
  }
}

async function exchangeCodeForToken(
  code: string,
  config: MetaOAuthConfig,
): Promise<{ accessToken: string; expiresIn: number }> {
  const url = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('client_secret', config.appSecret);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('code', code);

  const res = await request(url.toString());
  const body = (await res.body.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };
  if (!body.access_token) {
    throw new Error(`Token exchange failed: ${body.error?.message ?? 'unknown'}`);
  }
  return { accessToken: body.access_token, expiresIn: body.expires_in ?? 3600 };
}

async function exchangeForLongLived(
  shortToken: string,
  config: MetaOAuthConfig,
): Promise<{ accessToken: string; expiresIn: number }> {
  const url = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('client_secret', config.appSecret);
  url.searchParams.set('fb_exchange_token', shortToken);

  const res = await request(url.toString());
  const body = (await res.body.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };
  if (!body.access_token) {
    throw new Error(`Long-lived exchange failed: ${body.error?.message ?? 'unknown'}`);
  }
  return { accessToken: body.access_token, expiresIn: body.expires_in ?? 60 * 24 * 3600 };
}
