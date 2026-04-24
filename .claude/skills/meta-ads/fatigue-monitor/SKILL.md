---
name: meta-ads-fatigue-monitor
description: Detect Meta Ads creative fatigue before CTR collapses. Compares current vs previous window insights, flags ads with CTR drops above threshold or frequency cap breaches. Returns an HTML report with sorted fatigue list. Triggers on prompts about creative fatigue, CTR decay, frequency checks, or rotating stale creatives.
---

# Meta Ads — Fatigue Monitor

## When to use

- "Identifica criativos com fadiga nos últimos 7 dias"
- "Quais anúncios tão queimando a audiência?"
- "Check frequency cap breaches in the acme account"
- "CTR dropping ads — last 14 days"

## Inputs

- **account** ref (required)
- **adset** (optional — scope to a single ad set; omit for full account)
- **ctr-drop** threshold in % (default 20, from `config/thresholds.json`)
- **frequency** cap (default 3.5, from `config/thresholds.json`)
- **lookback** days (default 7)

## Logic

For each ad:

1. Fetch insights for `lookback` days (current window)
2. Fetch insights for previous same-length window
3. Compute CTR delta: `(current.ctr - previous.ctr) / previous.ctr * 100`
4. Flag if:
   - CTR delta ≤ `-ctrDropPct` (e.g., dropped 20%+)
   - OR current frequency ≥ `frequencyCap`

## Output

- HTML report sorted by worst CTR drop first
- Columns: ad id/name, status, current CTR, previous CTR, delta, frequency, spend, flags
- Markdown summary for Slack
- Printed terminal summary: `N / M ads flagged`

## Invocation

```bash
adskills meta fatigue \
  --account acme \
  --lookback 7 \
  --ctr-drop 20 \
  --frequency 3.5
```

## Guardrails

- Never pauses ads automatically — report only. User must trigger pause separately.
- Ads with zero impressions in both windows are skipped silently
- If `previous.ctr = 0`, delta is reported as 0 (cannot compute ratio)
