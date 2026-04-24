import { createServer } from 'node:http';
import { request } from 'undici';
import open from 'open';
import { logger } from './logger.js';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  port: number;
  scopes?: string[];
}

export interface GoogleOAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/drive.readonly',
];

export async function runGoogleOAuth(config: GoogleOAuthConfig): Promise<GoogleOAuthResult> {
  const scopes = config.scopes ?? DEFAULT_SCOPES;
  const state = Math.random().toString(36).slice(2);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  const code = await captureCode(config.port, state);
  return exchangeCode(code, config);

  async function captureCode(port: number, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);
        if (!url.pathname.startsWith('/oauth/google/callback')) {
          res.writeHead(404).end();
          return;
        }
        const returnedCode = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(
          error
            ? `<h1>Auth failed</h1><p>${error}</p>`
            : `<h1>AdSkills — Google OAuth OK</h1><p>You can close this tab.</p>`,
        );
        server.close();
        if (error) return reject(new Error(error));
        if (!returnedCode) return reject(new Error('Missing code'));
        if (returnedState !== expectedState) return reject(new Error('State mismatch'));
        resolve(returnedCode);
      });
      server.listen(port, () => {
        logger.info(`Opening browser for Google OAuth at port ${port}`);
        open(authUrl.toString()).catch(() => {
          logger.warn(`Visit: ${authUrl.toString()}`);
        });
      });
    });
  }
}

async function exchangeCode(
  code: string,
  config: GoogleOAuthConfig,
): Promise<GoogleOAuthResult> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await request('https://oauth2.googleapis.com/token', {
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
  if (!json.access_token || !json.refresh_token) {
    throw new Error(`Google token exchange failed: ${json.error_description ?? json.error ?? 'unknown'}`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in ?? 3600,
    scope: json.scope ?? '',
  };
}
