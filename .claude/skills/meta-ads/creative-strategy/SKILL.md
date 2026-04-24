---
name: meta-ads-creative-strategy
description: Bulk upload Meta Ads creatives from local folder or Google Drive, generate copy variations (headlines, primary text, descriptions), and structure ad sets by creative angle. Use when user asks to upload creatives, create ads in bulk, or launch campaigns from a batch of assets.
---

# Meta Ads — Creative Strategy

## When to use

Trigger on prompts like:

- "Sobe esses criativos da pasta X no Meta"
- "Cria 10 ads com essas imagens apontando pro ad set Y"
- "Bulk upload essas imagens + gera 3 variações de copy pra cada"
- "Upload creatives from ./assets/batch-2026-04/ to account coldiq"

## Inputs

1. **Source** — local folder path OR Google Drive folder URL (Drive = Phase 5)
2. **Target** — `adSetId` (Meta ad set the ads will be created under) + `pageId` (Facebook page)
3. **Account** — `accountRef` from `config/accounts.json`
4. **Briefing (optional)** — link URL, CTA type, copy seeds

If missing, **ask the user** — don't guess ad set IDs.

## Execution flow

```
1. Scan source folder → list image/video files (jpg, png, mp4)
2. Preview table to user: file name, size, mime, proposed ad name
3. Wait for confirmation
4. For each file:
   a. Upload to /act_X/adimages → get image_hash
   b. Generate copy variations (if requested) via Claude
   c. Create adcreative with object_story_spec (page + link_data + image_hash)
   d. Create ad with status=PAUSED (always PAUSED unless user says otherwise)
5. Generate HTML report at reports/meta-ads/creative-strategy/{timestamp}.html
6. Print summary: N creatives uploaded, M ads created, link to report
```

## Implementation

Use the helper in `src/commands/meta-bulk-upload.ts`:

```bash
adskills meta upload \
  --account coldiq \
  --folder ./assets/batch-2026-04 \
  --adset 23850123456789 \
  --page 100012345678 \
  --link https://landing.example.com \
  --cta LEARN_MORE
```

## Output

- All ads created with `status=PAUSED` (safe default)
- HTML report with thumbnails, ad names, creative IDs
- Markdown companion at same path for Slack sharing
- Printed summary with Ads Manager deep links

## Guardrails

- Refuse to create ads with `status=ACTIVE` unless user explicitly says "publica ativo" / "go live"
- Max 50 creatives per invocation — warn if folder has more
- If any upload fails mid-batch, print what succeeded and surface the error; do NOT retry automatically
- Preserve original file order for reproducibility
