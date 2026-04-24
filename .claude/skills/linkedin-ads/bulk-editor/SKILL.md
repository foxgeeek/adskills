---
name: linkedin-ads-bulk-editor
description: Bulk edit LinkedIn campaigns from CSV — status, daily budget, unit cost (bid). Preview before apply, confirmation required. Triggers on prompts about mass campaign edits, pausing many campaigns at once, or budget reallocations.
---

# LinkedIn Ads — Bulk Editor

## When to use

- "Pausa todas as campanhas dessa lista"
- "Aumenta o daily budget em todas essas campanhas"
- "Bulk edit LinkedIn campaigns from spreadsheet"

## CSV format

Columns (any combination of change columns — `campaign_id` is required):

```csv
campaign_id,status,daily_budget,unit_cost
1234567890,PAUSED,,,
1234567891,ACTIVE,50,
1234567892,,,8.50
```

- `status`: `ACTIVE`, `PAUSED`, or `ARCHIVED`
- `daily_budget`: number in account currency
- `unit_cost` (or `bid`): number in account currency

## Invocation

```bash
adskills linkedin bulk --account coldiq --csv ./edits/pause-underperformers.csv
adskills linkedin bulk --account coldiq --csv ./edits/raise-budgets.csv --dry-run
```

## Guardrails

- Preview printed before API calls (first 20 + count of rest)
- Confirmation prompt unless `--dry-run`
- Per-row failure is isolated — run continues, errors captured in the report
- Rows with no change columns are silently skipped
