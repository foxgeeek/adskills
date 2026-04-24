# Architecture

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Claude Code invocation (SKILL.md markdown in .claude/)      │
└───────────────────────────┬─────────────────────────────────┘
                            │ shell / natural language
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ CLI (commander) — src/commands/cli.ts                       │
│   parses flags → delegates to command functions             │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Commands (src/commands/*)                                   │
│   orchestration: scan, confirm, batch, render               │
│   each command does ONE thing                               │
└──────┬──────────────┬────────────────┬───────────────────────┘
       ▼              ▼                ▼
  ┌─────────┐   ┌───────────┐    ┌─────────────┐
  │ Clients │   │  Core     │    │  Reporters  │
  │ (APIs)  │   │ auth,     │    │  HTML + MD  │
  │         │   │ cache,    │    │             │
  │         │   │ rate      │    │             │
  └─────────┘   └───────────┘    └─────────────┘
```

## Modules

### `src/clients/`

One wrapper per platform. Each exposes a typed class:

- `MetaClient` — Graph API v21 via `undici` + form-encoded POST. Images use `/adimages` → `hash`. Ads are created via `/adcreatives` + `/ads`.
- `GoogleAdsClient` — `google-ads-api` (Opteo's REST wrapper). GAQL queries for insights, search terms, keywords. Customer match uses 3-step offline user data job (create → addOperations → run).
- `LinkedInClient` — REST v202410 via `undici`. REST.li 2.0 protocol, `X-RestLi-Method: PARTIAL_UPDATE` for campaign patches. DMP segments for ABM.

All clients accept a `RateLimiter` to cap concurrency.

### `src/core/`

- `auth.ts` — AES-256-GCM token store in `~/.adskills/tokens.json`. Key derived via `scrypt` from a session password + persistent salt at `~/.adskills/salt.bin`.
- `oauth-meta.ts`, `oauth-google.ts`, `oauth-linkedin.ts` — localhost-callback OAuth 2.0 flows. Meta uses short-lived → long-lived exchange; Google requires `access_type=offline` + `prompt=consent`; LinkedIn issues refresh tokens directly.
- `rate-limiter.ts` — promise queue with `maxConcurrent` + `minIntervalMs`.
- `cache.ts` — JSON-on-disk TTL cache under `~/.adskills/cache/`.
- `paths.ts` — single source of truth for `~/.adskills/*` paths.
- `logger.ts` — `kleur`-colored stdout at `LOG_LEVEL` from env.

### `src/commands/`

One file per CLI command. Each follows a template:

1. Load `config/accounts.json` + validate the target platform section
2. Fetch the token from the encrypted store
3. Instantiate the platform client
4. Preview the destructive part and prompt for confirmation (unless `--dry-run`)
5. Execute with a spinner (`ora`)
6. Write HTML + markdown reports to `reports/<platform>/<skill>/<timestamp>.{html,md}`
7. Print a terminal summary

### `src/utils/`

Pure functions only — easily unit-testable:

- `csv-parser.ts` — no dependency, handles quoted fields + semicolon delimiter
- `hash-pii.ts` — SHA-256 with per-platform normalization (email lowercase, BR phone E.164)
- `date-ranges.ts` — `lastNDays`, `previousWindow`, `monthToDate`, `daysInMonth`
- `scan-folder.ts` — filters jpg/png/mp4 and sorts deterministically
- `drive-fetcher.ts` — Drive v3 list + download using the Google OAuth access token

### `src/reporters/`

- `html-report.ts` — self-contained HTML with Tailwind + Chart.js via CDN. Exports `renderCreativeTable` and other domain-specific fragment renderers plus `writeReport`.
- `markdown-report.ts` — Slack/email-friendly companion.

## Data flow: `adskills meta upload`

```
user prompt → CLI flags → meta-upload.ts
  → scan-folder (or drive-fetcher) → asset list
  → prompt("yes?")
  → MetaClient.uploadImage → hash
  → MetaClient.createAdCreative → creativeId
  → MetaClient.createAd (status=PAUSED) → adId
  → html-report.writeReport → reports/meta-ads/creative-strategy/…
```

## Secrets model

- `.env` — platform app credentials (app id, client secret, developer token). Gitignored.
- `~/.adskills/tokens.json` — encrypted OAuth tokens. Never copied to the repo, never sent anywhere.
- `config/accounts.json` — account refs pointing to `tokenRef` keys. Contains non-secret IDs (ad account id, customer id, page id). Gitignored in practice because it carries customer identifiers.

## Extending

### New skill under an existing platform

1. `.claude/skills/<platform>/<new-skill>/SKILL.md`
2. `src/commands/<platform>-<new-skill>.ts`
3. Register on the existing `meta`/`google`/`linkedin` subcommand in `cli.ts`

### New platform entirely

1. Add OAuth flow under `src/core/oauth-<p>.ts`
2. Add `src/clients/<p>.ts`
3. Add a `Platform` value in `src/core/auth.ts`
4. Create `.claude/skills/<p>-ads/` with a root `SKILL.md` and sub-skills
5. Register a new subcommand in `cli.ts`
6. Update `init.ts` to offer the new platform
