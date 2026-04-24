---
name: linkedin-ads
description: Parent skill for LinkedIn Ads operations — campaigns, creatives, analytics, DMP segments (custom audiences). Delegates to sub-skills for ABM audience builds, bid optimization, bulk campaign edits, and creative format analysis.
---

# LinkedIn Ads — Root Skill

Sub-skills:

- **audience-builder/** — CSV → DMP segment (USER_EMAIL_LIST or USER_COMPANY_LIST)
- **bid-optimizer/** — analyze CTR + conv per campaign, suggest ±% bid adjustments
- **bulk-editor/** — CSV-driven bulk edits (status, daily budget, unit cost) with preview + confirmation
- **creative-strategist/** — format performance breakdown + next-test suggestions

## Prerequisites

1. `npx adskills init` → pick "LinkedIn Ads" → OAuth
2. `.env` populated with `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
3. `config/accounts.json` has `accountId` (format: `urn:li:sponsoredAccount:XXXXXXXX` or raw ID)

## API reference

- Base: `https://api.linkedin.com/rest`
- Version: `202410` (set via `LinkedIn-Version` header)
- Protocol: REST.li 2.0 (`X-Restli-Protocol-Version: 2.0.0`)
- Partial updates use `X-RestLi-Method: PARTIAL_UPDATE` with `patch.$set` payload

## Destructive action policy

Require confirmation:

- `bids --apply` (bid changes)
- `bulk` (any status/budget/bid edit)

Read-only by default:

- `audience` with `--dry-run`
- `creatives`

## URN conventions

- Campaign: `urn:li:sponsoredCampaign:{id}`
- Account: `urn:li:sponsoredAccount:{id}`
- Creative: `urn:li:sponsoredCreative:{id}`
