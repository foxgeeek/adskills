---
name: cross-platform-budget-rebalance
description: Recommend budget reallocation across Meta, Google, and LinkedIn based on per-platform CPA efficiency. Computes efficiency score (bestCPA/platformCPA) and weights budget proportionally. Read-only — recommendations must be applied manually. Triggers on prompts about where to shift budget or which platform to scale.
---

# Cross-Platform — Budget Rebalance

## When to use

- "Onde devo colocar mais budget?"
- "Qual plataforma tá com melhor CPA agora?"
- "Realoca $10k entre as 3 plataformas"

## Inputs

- `--account` — account ref
- `--budget` — total budget to allocate (required)
- `--lookback` — days (default 30)

## Logic

1. Fetch aggregated spend + conversions per platform over `lookback` days
2. Compute CPA per platform = `spend / conversions`
3. Efficiency = `minCPA / platformCPA` (best platform = 100%, worse = lower)
4. Recommended allocation = `(platformEfficiency / sumEfficiency) × totalBudget`
5. Delta = `recommended - currentShare` (where currentShare is today's spend distribution over the same budget)

## Output

- Summary cards: total budget, best CPA, lookback window
- Table per platform: spend, conv, CPA, efficiency %, current share, recommended, Δ
- Green/red deltas (green = give more, red = take away)

## Invocation

```bash
adskills cross rebalance --account acme --budget 10000 --lookback 30
```

## Guardrails

- **Read-only** — never mutates budgets on any platform
- Platforms with zero conversions are excluded from efficiency scoring (treated as 0%)
- Requires at least one platform with conversions; aborts gracefully otherwise
- Assumes conversion value parity across platforms — if conversion quality differs (e.g., MQL vs SQL), weight manually before applying
