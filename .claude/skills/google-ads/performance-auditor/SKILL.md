---
name: google-ads-performance-auditor
description: Google Ads period-over-period performance audit. Compares impressions, clicks, CTR, spend, CPC, conversions, CPA between current and previous window of same length. Generates HTML executive report. Triggers on prompts about performance audits, period comparisons, or "how is the account doing".
---

# Google Ads — Performance Auditor

## When to use

- "Faz auditoria dos últimos 30 dias vs 30 dias anteriores"
- "Como tá a performance do Google Ads da coldiq?"
- "Month-over-month audit"

## Inputs

- `--account` — account ref (required)
- `--lookback` — days (default 30)

## Output

- Table: metric, current, previous, Δ%
- Metrics: impressions, clicks, CTR, spend, CPC, conversions, CPA
- Colored deltas (green ↑ / red ↓)

## Invocation

```bash
adskills google audit --account coldiq --lookback 30
```

## Guardrails

- Read-only
- Uses account-level aggregate by default — campaign-level breakdown = Phase 4+
