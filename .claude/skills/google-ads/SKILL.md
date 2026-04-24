---
name: google-ads
description: Parent skill for Google Ads operations — campaigns, keywords, search terms, negatives, audits. Delegates to specialized sub-skills for keyword analysis, negative mining, performance auditing, and search-term classification.
---

# Google Ads — Root Skill

Sub-skills:

- **performance-auditor/** — period-over-period account audit (impr, clicks, CTR, CPC, conv, CPA, ROAS)
- **keyword-analyzer/** — quality score, impression share, CPC trends
- **search-terms/** — extract + classify search terms by intent
- **negative-keywords/** — mine negatives from zero-conversion search terms + optional bulk apply

## Prerequisites

1. `npx adskills init` → pick "Google Ads" → OAuth (refresh token)
2. `.env` populated with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DEVELOPER_TOKEN`
3. `config/accounts.json` has `customerId` and (for MCC accounts) `loginCustomerId`

## Account format

- `customerId`: 10-digit Google Ads customer ID. Dashes optional — the client strips them.
- `loginCustomerId`: set when the token was authorized via an MCC (agency manager) account

## Destructive action policy

The following require **explicit confirmation**:

- Adding negative keywords (`--apply` flag on `negatives` command)
- Pausing / removing keywords or campaigns (Phase 4+)

Default behavior = read-only reports.

## Metric conventions

- Spend: `cost_micros / 1_000_000`
- CPC: `average_cpc / 1_000_000`
- CTR: reported as 0–1 by API, converted to % for display
- Impression share: 0–1 by API, displayed as %
