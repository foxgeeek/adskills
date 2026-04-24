---
name: google-ads-negative-keywords
description: Mine negative keyword candidates from Google Ads search terms (terms with impressions + clicks + cost but zero conversions + low CTR). Can optionally bulk-apply negatives to an ad group with explicit confirmation. Triggers on prompts about wasted spend, negative keyword lists, or search term cleanup.
---

# Google Ads — Negative Keywords

## When to use

- "Acha termos que estão queimando budget"
- "Mine negatives from the last 30 days"
- "Onde estou gastando sem converter?"

## Inputs

- `--account` — account ref
- `--campaign` — optional scope
- `--lookback` — days (default 30)
- `--min-impressions` — default 50
- `--max-ctr` — max CTR % (default 1.0)
- `--min-spend` — default 5
- `--apply` — opt-in bulk apply
- `--ad-group <resource>` — required with `--apply` (e.g., `customers/1234/adGroups/56789`)

## Filter logic

A search term becomes a candidate if **all** hold:

- `impressions >= min-impressions`
- `ctr <= max-ctr`
- `cost >= min-spend`
- `conversions == 0`

## Output

- Summary cards: candidate count, wasted spend, filters applied
- Table: term, campaign, impr, clicks, CTR, cost
- If `--apply`: confirmation prompt → bulk create EXACT-match negatives in target ad group

## Invocation

```bash
# Report only
adskills google negatives --account coldiq --lookback 30

# Apply as EXACT negatives to specific ad group
adskills google negatives --account coldiq \
  --apply --ad-group customers/1234567890/adGroups/9876543210
```

## Guardrails

- `--apply` always prompts for "yes" — no auto-mutation
- EXACT match type only (safer than PHRASE/BROAD for first pass)
- Bulk apply target is one ad group per invocation — safer audit trail
