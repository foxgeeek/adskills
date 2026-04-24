---
name: cross-platform-dashboard
description: Consolidated performance dashboard across Meta, Google, and LinkedIn Ads. Aggregates spend, clicks, conversions, CTR, CPC, CPA into a single HTML report with spend/conversion share donut charts. Triggers on prompts about overall performance, cross-channel reports, or "how are we doing this month".
---

# Cross-Platform — Dashboard

## When to use

- "Como tá a performance geral dos últimos 30 dias?"
- "Unified dashboard of Meta + Google + LinkedIn"
- "Me mostra o total de spend e conversões das 3 plataformas"

## Inputs

- `--account` — account ref
- `--lookback` — days (default 30)

## Output

- 4 summary cards: total spend, total clicks, total conversions, blended CPA
- 2 donut charts: spend share + conversion share (Chart.js)
- Platform totals table: impr, clicks, CTR, spend, CPC, conv, CPA, spend %
- Error section if any platform call failed

## Invocation

```bash
adskills cross dashboard --account coldiq --lookback 30
```

## Guardrails

- Read-only
- Missing platform configs are skipped silently (no error)
- Currency conversions NOT applied — each platform reports in its own currency. If accounts use different currencies, interpret with care.
