---
name: meta-ads-spend-tracker
description: Track Meta Ads daily spend against a monthly budget. Projects end-of-month spend based on current pace, flags when burn rate exceeds expected pace, and generates a daily spend chart. Triggers on prompts about budget pacing, monthly projections, burn rate, or spend anomalies.
---

# Meta Ads — Spend Tracker

## When to use

- "Como tá o ritmo de gasto do mês?"
- "Projeta o spend final de Abril na conta acme"
- "Alguma campanha queimando budget rápido demais?"
- "Month-to-date spend report"

## Inputs

- **account** ref (required)
- **budget** monthly target (optional — without it, report skips pace alerts)

## Output

- Summary cards: MTD spend, avg daily, projected month, pace vs expected
- Chart.js line chart: daily spend + even-pace reference line (if budget given)
- Alerts list (pulled from `config/thresholds.json`):
  - Daily burn > expected pace × `dailyBurnAlertPct`
  - Projected month > budget × `monthlyProjectionAlertPct`

## Invocation

```bash
adskills meta spend \
  --account acme \
  --budget 5000
```

## Logic

1. Fetch account-level daily insights for month-to-date
2. Sum spend per day, compute avg, project `avg × totalDaysInMonth`
3. Compare pace vs expected (`daysElapsed / totalDays × 100%`)
4. Trigger alerts per thresholds

## Guardrails

- Read-only — never mutates campaigns or budgets
- Currency = account currency as reported by Meta (no conversion)
