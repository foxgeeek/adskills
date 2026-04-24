---
name: linkedin-ads-bid-optimizer
description: Analyze LinkedIn campaign CTR, conversions, and actual CPC vs bid, then suggest ±% bid adjustments. Can apply adjustments with explicit confirmation. Triggers on prompts about bid tuning, CPC/CTR optimization, or reallocating spend to winning campaigns.
---

# LinkedIn Ads — Bid Optimizer

## When to use

- "Ajusta lances pra cima nas campanhas que tão convertendo"
- "Which LinkedIn campaigns should I raise bids on?"
- "Diminui o bid dos que estão com CPC alto demais"

## Logic

For each campaign over `lookback` days:

- Suggest **raise** if `ctr ≥ min-ctr` AND `conversions > 0`
- Suggest **lower** if `actual_cpc > current_bid × max-cpc-raise-ratio`
- Otherwise **hold**

Adjustment amount = `±adjust%` of current unitCost.

## Inputs

- `--account` — account ref
- `--lookback` — days (default 14)
- `--min-ctr` — CTR % threshold (default 0.4)
- `--max-cpc-raise-ratio` — CPC/bid threshold (default 0.9)
- `--adjust` — adjustment % (default 15)
- `--apply` — opt-in to execute (prompts for confirmation)

## Invocation

```bash
# Report only
adskills linkedin bids --account acme

# Apply suggestions
adskills linkedin bids --account acme --apply --adjust 15
```

## Guardrails

- `--apply` always prompts for "yes"
- Per-campaign failures do not abort the run
- Reports HTML + markdown with every suggestion including "hold"
