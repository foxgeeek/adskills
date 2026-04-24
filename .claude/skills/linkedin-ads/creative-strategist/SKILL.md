---
name: linkedin-ads-creative-strategist
description: Analyze LinkedIn creative format performance (single image, carousel, video, document, lead gen) and suggest next formats to test. Aggregates by format across all creatives in a campaign. Triggers on prompts about which format to double down on, lead gen performance, or creative testing strategy.
---

# LinkedIn Ads — Creative Strategist

## When to use

- "Qual formato tá performando melhor no LinkedIn?"
- "Double down ou pausa formato X?"
- "What creative format should I test next?"

## Inputs

- `--account` — account ref
- `--campaign` — required campaign ID
- `--lookback` — days (default 30)

## Logic

1. Fetch creative-level insights pivoted by `CREATIVE`
2. Aggregate by creative `format`
3. Compute per-format: creatives count, impressions, clicks, CTR, spend, leads, CPL
4. Sort by clicks (volume indicator)
5. Suggest:
   - Double down on best format if CTR > 1% AND leads > 0
   - Pause worst format if spend > $100 AND leads = 0
   - Test second format if only one format in flight

## Output

- Format-level table with all metrics
- Suggestions block (bullet list)
- HTML + markdown report

## Invocation

```bash
adskills linkedin creatives --account coldiq --campaign 1234567890 --lookback 30
```

## Guardrails

- Read-only
- Does not count formats with zero impressions (noise filter)
- Suggestions are heuristic — always validate with domain knowledge of the offer
