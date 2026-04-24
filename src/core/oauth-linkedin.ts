import { createServer } from 'node:http';
import { request } from 'undici';
import open from 'open';
import { logger } from './logger.js';

export interface LinkedInOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  port: number;
  scopes?: string[];
}

export interface LinkedInOAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}

const DEFAULT_SCOPES = [
  'r_ads',
  'rw_ads',
  'r_ads_reporting',
  'r_organization_social',
  'w_member_social',
];

export async function runLinkedInOAuth(
  config: LinkedInOAuthConfig,
): Promise<LinkedInOAuthResult> {
  const scopes = config.scopes ?? DEFAULT_SCOPES;
  const state = Math.random().toString(36).slice(2);

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('state', state);

  const code = await captureCode(config.port, state);
  return exchangeCode(code, config);

  async function captureCode(port: number, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);
        if (!url.pathname.startsWith('/oauth/linkedin/callback')) {
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
            : `<h1>AdSkills — LinkedIn OAuth OK</h1><p>You can close this tab.</p>`,
        );
        server.close();
        if (error) return reject(new Error(error));
        if (!returnedCode) return reject(new Error('Missing code'));
        if (returnedState !== expectedState) return reject(new Error('State mismatch'));
        resolve(returnedCode);
      });
      server.listen(port, () => {
        logger.info(`Opening browser for LinkedIn OAuth at port ${port}`);
        open(authUrl.toString()).catch(() => {
          logger.warn(`Visit: ${authUrl.toString()}`);
        });
      });
    });
  }
}

async function exchangeCode(
  code: string,
  config: LinkedInOAuthConfig,
): Promise<LinkedInOAuthResult> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });
  const res = await request('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = (await res.body.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!json.access_token) {
    throw new Error(`LinkedIn token exchange failed: ${json.error_description ?? json.error ?? 'unknown'}`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in ?? 60 * 24 * 3600,
    scope: json.scope ?? '',
  };
}
