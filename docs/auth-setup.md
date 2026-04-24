# Authentication setup per platform

All three platforms use OAuth 2.0 with localhost callback on port `OAUTH_CALLBACK_PORT` (default `3000`). Run `adskills init` and pick the platform — the wizard opens the browser, captures the auth code, and stores the long-lived token encrypted.

## Meta (Facebook/Instagram)

1. Create a Meta for Developers app at <https://developers.facebook.com/apps/>
2. Enable the **Marketing API** product
3. Add `http://localhost:3000/oauth/meta/callback` as an OAuth redirect URI
4. Copy **App ID** + **App Secret** into `.env`
   ```
   META_APP_ID=...
   META_APP_SECRET=...
   META_REDIRECT_URI=http://localhost:3000/oauth/meta/callback
   ```
5. `adskills init` → **Meta** → complete the flow
6. The token is exchanged for a long-lived token (~60 days). Refresh by re-running `adskills init` before expiry.

### Required scopes

- `ads_management`, `ads_read` — create/read campaigns, ads, creatives
- `business_management` — access Business accounts and ad accounts
- `pages_read_engagement`, `pages_manage_ads` — run ads on behalf of Pages

### `config/accounts.json`

```json
{
  "acme": {
    "meta": {
      "adAccountId": "act_1234567890",
      "businessId": "",
      "tokenRef": "meta.acme"
    }
  }
}
```

## Google Ads

1. Create a Google Cloud project and enable the **Google Ads API**
2. Configure OAuth consent screen (External, Testing is fine for single-user use)
3. Create an **OAuth 2.0 Client ID** (Web application) with redirect URI `http://localhost:3000/oauth/google/callback`
4. Apply for a **Developer Token** at <https://ads.google.com/aw/apicenter> (Basic Access sufficient for reads and first-party customer match)
5. Fill `.env`
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_DEVELOPER_TOKEN=...
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/google/callback
   ```
6. `adskills init` → **Google Ads** → complete the flow (refresh token is captured because `access_type=offline` + `prompt=consent`)

### Required scopes

- `https://www.googleapis.com/auth/adwords` — Ads API
- `https://www.googleapis.com/auth/drive.readonly` — Drive folder source for bulk uploads (optional)

### `config/accounts.json`

```json
{
  "acme": {
    "google": {
      "customerId": "123-456-7890",
      "loginCustomerId": "111-111-1111",
      "tokenRef": "google.acme"
    }
  }
}
```

- `customerId` — the ad account you want to manage
- `loginCustomerId` — set only when the token was authorized by an MCC (manager account). Dashes optional.

## LinkedIn Ads

1. Apply for LinkedIn Marketing Developer Platform at <https://developer.linkedin.com/>
2. Create an app, request **Advertising API** + **Community Management API** products
3. Add redirect URI `http://localhost:3000/oauth/linkedin/callback`
4. Fill `.env`
   ```
   LINKEDIN_CLIENT_ID=...
   LINKEDIN_CLIENT_SECRET=...
   LINKEDIN_REDIRECT_URI=http://localhost:3000/oauth/linkedin/callback
   ```
5. `adskills init` → **LinkedIn Ads** → complete the flow

### Required scopes

- `r_ads`, `rw_ads` — read + write campaigns, creatives, ad accounts
- `r_ads_reporting` — analytics endpoints
- `r_organization_social`, `w_member_social` — Page-level operations

### `config/accounts.json`

```json
{
  "acme": {
    "linkedin": {
      "accountId": "urn:li:sponsoredAccount:123456789",
      "tokenRef": "linkedin.acme"
    }
  }
}
```

URN prefix is auto-added if you pass a raw numeric ID.

## Token rotation

- Meta long-lived tokens expire after ~60 days — rerun `adskills init`
- Google refresh tokens do not expire (unless revoked) — the underlying `google-ads-api` lib refreshes access tokens automatically
- LinkedIn access tokens last 60 days; refresh tokens last 365 days. When close to expiry, rerun `adskills init`.

## Multiple accounts (agency setup)

Each `accountRef` in `config/accounts.json` points to a dedicated `tokenRef`. Running `adskills init` for a new account ref saves a separate token alongside the existing ones in the encrypted store.

```bash
adskills init          # → accountRef: acme
adskills init          # → accountRef: cliente2
adskills meta audit -a acme
adskills meta audit -a cliente2
```
