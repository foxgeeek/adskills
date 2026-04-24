---
name: google-ads-search-terms
description: Extract Google Ads search terms report and classify by intent (commercial, informational, navigational, unknown) using PT/EN keyword hints. Triggers on prompts about search terms, intent analysis, or finding keyword opportunities.
---

# Google Ads — Search Terms

## When to use

- "Quais search terms estão vindo na conta?"
- "Classifica os search terms por intenção"
- "Find commercial intent search terms I should add as keywords"

## Inputs

- `--account` — account ref
- `--campaign` — optional campaign scope
- `--lookback` — days (default 30)

## Classification

- **Commercial** — PT/EN purchase-intent words (comprar, preço, contratar, buy, price, hire, ...)
- **Informational** — PT/EN how/what/guide words (como, tutorial, how to, guide, ...)
- **Navigational** — login/entrar/site
- **Unknown** — everything else (review manually)

## Output

- 5 summary cards (one per intent)
- 4 tables (50 rows each) sorted by clicks
- Columns: term, campaign, clicks, impr, CTR, cost, conv

## Invocation

```bash
adskills google search-terms --account coldiq --lookback 30
```

## Guardrails

- Read-only
- Intent classifier is naive keyword-hint matching — always sanity-check before acting on "unknown" bucket
