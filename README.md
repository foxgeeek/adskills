<div align="center">

# adskills

**Ad operations, from the terminal.**
A Claude Code Skills framework for operating Meta, Google, and LinkedIn Ads in natural language.

[![License: MIT](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](./LICENSE)
[![Node 22+](https://img.shields.io/badge/node-%E2%89%A522-10b981?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-strict-3178c6?style=flat-square)](./tsconfig.json)
[![Tests](https://img.shields.io/badge/vitest-36%2F36-10b981?style=flat-square)](./src)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skills-fbbf24?style=flat-square)](https://www.anthropic.com/claude-code)

</div>

---

## Table of contents

- [What is adskills](#what-is-adskills)
- [Why](#why)
- [Features](#features)
- [Install](#install)
- [Quickstart](#quickstart)
- [Commands](#commands)
- [Claude Code Skills](#claude-code-skills)
- [Architecture](#architecture)
- [Security](#security)
- [Dev & production](#dev--production)
- [Tests & CI](#tests--ci)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What is adskills

`adskills` is a **CLI + set of [Claude Code Skills](https://www.anthropic.com/claude-code)** that turns natural-language prompts into auditable ad-operations runs across three platforms:

- **Meta Ads** (Facebook / Instagram)
- **Google Ads** (Search, Performance Max)
- **LinkedIn Ads** (ABM, Sponsored Content)
- **Cross-platform** workflows (one prompt → three platforms simultaneously)

You describe what you want. The matching skill loads, the CLI fetches your encrypted OAuth token, previews the change list, asks for confirmation, executes against the ad API, and writes an HTML + markdown report to `reports/`.

```
❯ adskills rebalance $8k across platforms for account acme
› invoking skill cross-platform/budget-rebalance
  fetching 30d performance · 3 platforms
  Meta      CPA $14.20  efficiency 100%
  Google    CPA $26.80  efficiency  53%
  LinkedIn  CPA $51.40  efficiency  28%
  → shift +$1,840 from LinkedIn to Meta
  ✓ report reports/cross-ads/budget-rebalance/2026-04-24.html
```

---

## Why

Ad managers train you to click. Media-buying software trains you to toggle and save. Both cost hours every week in bulk edits, cross-channel audits, audience rebuilds, and fatigue detection that are easily expressed as a sentence.

`adskills` moves all of that into the terminal, behind Claude Code, with three hard rules:

1. **Every destructive action previews a diff and asks for confirmation.** No auto-pause, no auto-publish.
2. **Your OAuth tokens never leave your machine.** AES-256-GCM encrypted under `~/.adskills`.
3. **Every run produces a self-contained HTML report** you own — Slack it, archive it, diff it. No SaaS URL that expires.

---

## Features

### Meta Ads (4 skills)

| Skill | What it does |
|---|---|
| `creative-strategy` | Bulk upload images / videos from a local folder **or Google Drive** to an ad set. Creates ads as `PAUSED`. Emits HTML report with thumbnails. |
| `audience-builder` | CSV → Meta custom audience. SHA-256 hashes emails and Brazilian phone numbers (E.164) client-side before upload. |
| `fatigue-monitor` | Flags ads whose CTR dropped ≥ 20% vs the previous window **or** whose frequency ≥ 3.5. Read-only — you pause after review. |
| `spend-tracker` | Month-to-date pacing, monthly projection, burn alerts against `config/thresholds.json`. Chart.js trend in the report. |

### Google Ads (4 skills)

| Skill | What it does |
|---|---|
| `performance-auditor` | Period-over-period audit: impressions, clicks, CTR, spend, CPC, conversions, CPA. Green/red deltas. |
| `keyword-analyzer` | Quality Score, Impression Share, CPC per keyword. Flags QS ≤ 4 and IS < 50%. |
| `search-terms` | Pulls search-term report, classifies by intent (commercial / informational / navigational) with PT + EN hints. |
| `negative-keywords` | Mines zero-conversion search terms and, with `--apply`, bulk-creates EXACT-match negatives in a target ad group. |

### LinkedIn Ads (4 skills)

| Skill | What it does |
|---|---|
| `audience-builder` | CSV → DMP segment. Supports `USER` (email SHA-256) and `COMPANY` (ABM) modes. |
| `bid-optimizer` | CTR / CPC heuristics suggest ±% bid changes. Optional `--apply` with confirmation. |
| `bulk-editor` | CSV of `campaign_id,status,daily_budget,unit_cost` → partial update. Preview + confirm. |
| `creative-strategist` | Aggregates creative performance by format (single-image, carousel, video, doc, lead-gen). Suggests next tests. |

### Cross-platform (3 skills)

| Skill | What it does |
|---|---|
| `crm-sync` | One CSV → Meta custom audience + Google customer match + LinkedIn DMP segment simultaneously. Per-platform success tracking. |
| `dashboard` | Consolidated HTML report across all 3 platforms: spend share, conversion share (Chart.js donuts), blended CPA. |
| `budget-rebalance` | Efficiency-weighted (CPA-based) reallocation recommendation over a target total budget. Read-only. |

---

## Install

```bash
git clone https://github.com/foxgeeek/adskills
cd adskills
pnpm install
cp .env.example .env
cp config/accounts.example.json config/accounts.json
```

### Requirements

- Node.js 22+
- pnpm 9 or 10
- A Meta for Developers app, a Google Cloud project with Ads API enabled, and a LinkedIn Marketing Developer app (see [docs/auth-setup.md](./docs/auth-setup.md))

---

## Quickstart

### 1. Authenticate

```bash
pnpm cli init
```

Interactive wizard — pick Meta, Google, or LinkedIn, finish the OAuth flow in the browser that opens, set a session password. Tokens are stored encrypted at `~/.adskills/tokens.json`.

### 2. Configure your account

Edit `config/accounts.json`:

```json
{
  "acme": {
    "meta": { "adAccountId": "act_1234567890", "tokenRef": "meta.acme" },
    "google": { "customerId": "123-456-7890", "tokenRef": "google.acme" },
    "linkedin": { "accountId": "urn:li:sponsoredAccount:9999", "tokenRef": "linkedin.acme" }
  }
}
```

### 3. Run anything

```bash
# Bulk upload creatives (dry-run first)
pnpm cli meta upload \
  --account acme \
  --folder ./assets/q2 \
  --adset 23850123456789 \
  --page 100012345678 \
  --link https://landing.example.com \
  --cta LEARN_MORE \
  --dry-run

# CRM sync across all 3 platforms
pnpm cli cross crm-sync --account acme \
  --csv ./leads/abril-hot.csv \
  --name "Hot Leads — Abril 2026"

# Unified dashboard
pnpm cli cross dashboard --account acme --lookback 30
```

### 4. Use from Claude Code

Put the repo inside a workspace Claude Code can see. Skills in `.claude/skills/` load automatically. Prompt in natural language:

> "Upload the creatives in ./assets/q2 to the acme account, ad set 23850123456789, as paused."

---

## Commands

Every command is `adskills <platform> <action>` (via `pnpm cli` in the repo, or the `adskills` binary after `npm link`).

### Meta

| Command | Purpose |
|---|---|
| `adskills meta upload` | Bulk creative upload from folder or Drive |
| `adskills meta audience` | CSV → custom audience (hashed) |
| `adskills meta fatigue` | Detect CTR decay / frequency cap breaches |
| `adskills meta spend` | MTD pacing and monthly projection |

### Google

| Command | Purpose |
|---|---|
| `adskills google audit` | Period-over-period performance audit |
| `adskills google keywords` | Keyword QS + IS analysis |
| `adskills google search-terms` | Intent-classified search terms |
| `adskills google negatives` | Mine negatives, `--apply` to bulk-create |

### LinkedIn

| Command | Purpose |
|---|---|
| `adskills linkedin audience` | DMP segment from CSV (USER or COMPANY) |
| `adskills linkedin bids` | Bid optimization suggestions, `--apply` to execute |
| `adskills linkedin bulk` | CSV-driven bulk campaign edits |
| `adskills linkedin creatives` | Format performance breakdown |

### Cross-platform

| Command | Purpose |
|---|---|
| `adskills cross crm-sync` | Sync a CSV as custom audience across all 3 platforms |
| `adskills cross dashboard` | Unified performance dashboard |
| `adskills cross rebalance` | Efficiency-weighted budget reallocation |

Every destructive command supports `--dry-run`. Every mutation prompts for explicit `yes` before calling the API.

---

## Claude Code Skills

Skills live under `.claude/skills/`. Each skill has a `SKILL.md` declaring:

- `name` and `description` (for Claude to pick the right one)
- "When to use" trigger phrases in EN + PT
- Required inputs
- Destructive-action guardrails

When you prompt Claude Code inside the repo, the relevant skill loads as context and Claude invokes the underlying CLI.

```
.claude/skills/
├── meta-ads/
│   ├── SKILL.md
│   ├── creative-strategy/SKILL.md
│   ├── audience-builder/SKILL.md
│   ├── fatigue-monitor/SKILL.md
│   └── spend-tracker/SKILL.md
├── google-ads/
│   ├── SKILL.md
│   ├── performance-auditor/SKILL.md
│   ├── keyword-analyzer/SKILL.md
│   ├── search-terms/SKILL.md
│   └── negative-keywords/SKILL.md
├── linkedin-ads/
│   ├── SKILL.md
│   ├── audience-builder/SKILL.md
│   ├── bid-optimizer/SKILL.md
│   ├── bulk-editor/SKILL.md
│   └── creative-strategist/SKILL.md
└── cross-platform/
    ├── SKILL.md
    ├── crm-sync/SKILL.md
    ├── dashboard/SKILL.md
    └── budget-rebalance/SKILL.md
```

Total: **14 skills** across 4 families.

---

## Architecture

Five layers, each minding its business:

```
.claude/skills  →  CLI (commander)  →  commands/*.ts
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
               clients/*.ts        core/*.ts          reporters/*.ts
               (Meta, Google,      (auth, cache,      (HTML, markdown)
                LinkedIn wrappers)  rate-limiter)
```

- **`.claude/skills/`** — markdown instructions Claude reads
- **`src/commands/`** — one file per CLI command, orchestrates scan → confirm → batch → report
- **`src/clients/`** — typed wrappers over Meta Graph API, `google-ads-api`, LinkedIn REST v202410
- **`src/core/`** — OAuth flows, encrypted token store, rate limiter, logger, JSON-on-disk cache
- **`src/reporters/`** — self-contained HTML (Tailwind + Chart.js via CDN) and markdown companion

Full diagram + data-flow walkthrough in [docs/architecture.md](./docs/architecture.md).

---

## Security

| Concern | How it's handled |
|---|---|
| OAuth tokens | AES-256-GCM encrypted at `~/.adskills/tokens.json`, key derived via scrypt from a session password. Salt persisted at `~/.adskills/salt.bin`. |
| PII in audiences | Emails lowercased + SHA-256'd, phones normalized to E.164 + SHA-256'd, all **before** leaving the machine. |
| Destructive API calls | Every pause, budget change, bid change, negative-keyword apply, and ACTIVE publish requires an interactive `yes`. |
| Default ad status | `PAUSED`. Go ACTIVE only when `--status ACTIVE` is explicit. |
| Secrets in git | `.env`, `config/accounts.json`, `reports/`, and `~/.adskills/` are gitignored. |
| LGPD / GDPR | No raw PII touches any platform API; hashed identifiers only. |

Detailed auth-setup walkthrough per platform: [docs/auth-setup.md](./docs/auth-setup.md).

---

## Dev & production

### Dev

```bash
pnpm dev          # runs site + CLI typecheck watch + vitest watch in parallel
pnpm dev:site     # landing only (localhost:3000)
pnpm cli <cmd>    # run the CLI via tsx (e.g. pnpm cli init, pnpm cli meta upload ...)
```

### Production build

```bash
pnpm build          # builds both halves
pnpm build:cli      # TypeScript → dist/ only
pnpm build:site     # Next.js → site/.next/ only
pnpm start          # next start (after build:site)
```

The CLI can be installed globally:

```bash
pnpm build:cli
npm link            # exposes `adskills` on your PATH
adskills init       # from anywhere
```

The landing page deploys fully static to Vercel / Cloudflare Pages / Netlify by pointing at `site/` as the project root.

---

## Tests & CI

```bash
pnpm test           # vitest run
pnpm test:watch     # vitest watch
pnpm lint           # eslint
```

36 unit tests across pure utilities: `hash-pii`, `csv-parser`, `date-ranges`, `scan-folder`, `rate-limiter`, `auth` (encrypted token roundtrip), `html-report` (XSS escape).

GitHub Actions runs typecheck + lint + tests on Node 20 and 22 for every PR and push to `main` — see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

---

## Roadmap

- [x] Phase 1 — TypeScript scaffold + Meta OAuth + creative upload
- [x] Phase 2 — Meta: audience-builder, fatigue-monitor, spend-tracker
- [x] Phase 3 — Google Ads: performance-auditor, keyword-analyzer, search-terms, negative-keywords
- [x] Phase 4 — LinkedIn Ads: audience-builder, bid-optimizer, bulk-editor, creative-strategist
- [x] Phase 5 — Cross-platform workflows + Google Drive source for creatives
- [x] Phase 6 — Tests, CI, docs, landing page
- [ ] Video fingerprint + bulk video upload (Meta)
- [ ] Performance Max asset groups (Google)
- [ ] LinkedIn lead-form CSV export skill
- [ ] `adskills` published on npm
- [ ] Audit-log signing for agency compliance workflows

---

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR. TL;DR:

- Strict TypeScript, no `any` except when bridging REST / protobuf shapes at the client boundary
- Every new mutating command needs a confirmation prompt and a `--dry-run` path
- PII must be SHA-256 hashed at `src/utils/hash-pii.ts` — never sent raw
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`)

---

## License

[MIT](./LICENSE) — do whatever you want, including rebranding it for your agency.
