---
name: google-ads-keyword-analyzer
description: Analyze Google Ads keywords — quality score, impression share, CPC, conversions. Flags low-QS (≤4) and low-IS (<50%) keywords. Triggers on prompts about keyword performance, quality score issues, or impression share gaps.
---

# Google Ads — Keyword Analyzer

## When to use

- "Quais keywords têm QS baixo?"
- "Onde estou perdendo impression share?"
- "Top keywords por clicks na conta X"

## Inputs

- `--account` — account ref
- `--campaign` — optional campaign id scope
- `--lookback` — days (default 30)

## Output

- Summary cards: active keywords, low-QS count, low-IS count
- Table: top 100 by clicks with QS, IS%, CPC, conv
- Row colors: QS ≤4 red, IS <50% yellow

## Invocation

```bash
adskills google keywords --account acme --lookback 30
```

## Guardrails

- Read-only
