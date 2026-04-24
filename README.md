# adskills

Claude Code Skills framework for multi-platform ad ops — Meta, Google, LinkedIn.

Manage campaigns, upload creatives in bulk, detect fatigue, sync audiences, and audit performance via natural-language prompts in Claude Code.

## Status

**Phase 1 — MVP ✓**
- [x] TypeScript scaffold + ESLint/Prettier
- [x] Client stubs for Meta / Google / LinkedIn
- [x] Meta OAuth (long-lived token) + encrypted token store (AES-256-GCM + scrypt)
- [x] `meta-ads/creative-strategy` skill with bulk local-folder upload
- [x] HTML + Markdown report generator

**Phase 2 — Meta complete ✓**
- [x] `audience-builder` — CSV → SHA-256 hashed custom audience (BR phone normalization)
- [x] `fatigue-monitor` — CTR decay + frequency cap detection with period-over-period comparison
- [x] `spend-tracker` — MTD pace, monthly projection, burn alerts with Chart.js trend

**Phase 3 — Google Ads ✓**
- [x] Google OAuth with refresh token
- [x] `GoogleAdsClient` via google-ads-api (GAQL queries)
- [x] `performance-auditor` — period-over-period audit
- [x] `keyword-analyzer` — QS, IS, CPC analysis
- [x] `search-terms` — intent classification (PT/EN)
- [x] `negative-keywords` — mine + optional bulk apply

**Phase 4 — LinkedIn Ads ✓**
- [x] LinkedIn OAuth 2.0 3-legged flow + refresh token
- [x] `LinkedInClient` (REST v202410, REST.li 2.0 protocol)
- [x] `audience-builder` — DMP segment from CSV (user or company)
- [x] `bid-optimizer` — CTR + CPC analysis with optional bulk bid apply
- [x] `bulk-editor` — CSV-driven campaign edits (status/budget/bid)
- [x] `creative-strategist` — format performance + next-test suggestions

**Phase 5 — Cross-platform workflows ✓**
- [x] Google Ads customer match support (`createUserList` + offline user data job)
- [x] `cross crm-sync` — CSV → Meta + Google + LinkedIn audiences in one run
- [x] `cross dashboard` — consolidated HTML report (spend/conv share donuts)
- [x] `cross rebalance` — efficiency-weighted budget recommendations
- [x] Google Drive source for `meta upload` (`--drive-folder <url>`)
- [x] Cross-platform skills under `.claude/skills/cross-platform/`

**Phase 6 — Polishing ✓**
- [x] Vitest unit tests for pure utilities (36 passing)
- [x] GitHub Actions CI (Node 20 + 22, typecheck + lint + test)
- [x] Expanded docs: [architecture.md](docs/architecture.md), [auth-setup.md](docs/auth-setup.md), [CONTRIBUTING.md](CONTRIBUTING.md), LICENSE
- [ ] LinkedIn Ads (Phase 4)
- [ ] Cross-platform workflows (Phase 5)

## Install

```bash
pnpm install
cp .env.example .env
cp config/accounts.example.json config/accounts.json
```

Fill in `.env` with your Meta App ID/Secret. Edit `config/accounts.json` with your ad account ID.

## Setup — Meta OAuth

```bash
pnpm dev init
```

Opens browser → Meta login → grant permissions → token saved encrypted at `~/.adskills/tokens.json`.

## Bulk upload creatives (Meta)

```bash
pnpm dev meta upload \
  --account coldiq \
  --folder ./assets/batch-2026-04 \
  --adset 23850123456789 \
  --page 100012345678 \
  --link https://landing.example.com \
  --cta LEARN_MORE \
  --primary-text "Primary text applied to all creatives" \
  --headline "Shared headline" \
  --dry-run
```

- Scans folder for `.jpg`, `.jpeg`, `.png` (mp4 = Phase 2)
- Prints preview and asks for confirmation
- Uploads each image, creates `adcreative`, attaches to ad set as `PAUSED`
- Generates HTML report at `reports/meta-ads/creative-strategy/{timestamp}.html`

## Custom audience from CSV

```bash
pnpm dev meta audience \
  --account coldiq \
  --csv ./leads/abril-hot.csv \
  --name "Hot Leads — Abril 2026"
```

PII is hashed client-side (SHA-256, normalized per Meta spec) before leaving the machine. Supported CSV columns: `email`, `phone`/`telefone`/`celular`/`whatsapp`, `first_name`/`nome`, `last_name`/`sobrenome`.

## Fatigue scan

```bash
pnpm dev meta fatigue \
  --account coldiq \
  --lookback 7 \
  --ctr-drop 20 \
  --frequency 3.5
```

Reports ads with CTR drop ≥ 20% vs previous window or frequency ≥ 3.5. Read-only — nothing is paused automatically.

## Spend tracker

```bash
pnpm dev meta spend \
  --account coldiq \
  --budget 5000
```

MTD spend, daily chart, month projection, pacing alerts per `config/thresholds.json`.

## Claude Code Skills

Skills live in `.claude/skills/{platform}/{task}/SKILL.md`. When invoked from Claude Code, the model reads the SKILL.md and calls the underlying CLI / TS helpers.

Available now:

- `.claude/skills/meta-ads/SKILL.md` — root Meta skill
- `.claude/skills/meta-ads/creative-strategy/SKILL.md` — bulk creative uploads
- `.claude/skills/meta-ads/audience-builder/SKILL.md` — CSV → custom audience (hashed)
- `.claude/skills/meta-ads/fatigue-monitor/SKILL.md` — creative fatigue detection
- `.claude/skills/meta-ads/spend-tracker/SKILL.md` — budget pacing

## Security

- Tokens encrypted with AES-256-GCM, key derived via `scrypt` from your session password
- Stored at `~/.adskills/tokens.json` (mode 0600), salt at `~/.adskills/salt.bin`
- Never commit `.env`, `config/accounts.json`, or the reports folder

## Destructive action policy

All pauses, deletes, budget changes, and ACTIVE publishes require explicit confirmation. Default ad status on upload is `PAUSED`.

## License

MIT
