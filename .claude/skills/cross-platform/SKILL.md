---
name: cross-platform
description: Orchestrate workflows that span Meta, Google, and LinkedIn Ads simultaneously. Sub-skills cover CRM audience sync across all platforms, unified performance dashboards, and efficiency-based budget rebalancing recommendations.
---

# Cross-Platform — Root Skill

Sub-skills:

- **crm-sync/** — single CSV → Meta custom audience + Google customer match + LinkedIn DMP segment in one run
- **dashboard/** — consolidated HTML dashboard of spend, clicks, conversions, CPA across all 3 platforms
- **budget-rebalance/** — efficiency-weighted budget reallocation recommendations (read-only)

## Prerequisites

- All three platforms authenticated via `adskills init`
- `config/accounts.json` has `meta`, `google`, and/or `linkedin` sections under the same `accountRef`
- At least one platform must return conversion data for budget-rebalance

## Destructive action policy

- `crm-sync` creates audiences/lists/segments on each platform — requires explicit confirmation
- `dashboard` and `rebalance` are read-only

## Partial success behavior

- If one platform fails in `crm-sync`, the others still attempt — failures are surfaced in the HTML report
- `dashboard` skips platforms missing from `accounts.json` silently
