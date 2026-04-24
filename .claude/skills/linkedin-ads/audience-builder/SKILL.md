---
name: linkedin-ads-audience-builder
description: Build LinkedIn DMP segments from CSV for ABM campaigns. Supports USER_EMAIL_LIST (contacts) and USER_COMPANY_LIST (companies). Hashes emails with SHA-256 before upload. Triggers on prompts about uploading contact/company lists or building ABM audiences on LinkedIn.
---

# LinkedIn Ads — Audience Builder (ABM)

## When to use

- "Sobe essa lista de empresas no LinkedIn pra ABM"
- "Create a DMP segment from the SDR export"
- "Upload contacts to LinkedIn as custom audience"

## Inputs

- `--account` — account ref
- `--csv` — CSV path
- `--name` — audience name
- `--type` — `USER` (default) or `COMPANY`
- `--description` — optional

## CSV columns

- **USER** mode: `email` (required, SHA-256 hashed before upload), optionally `first_name`, `last_name`
- **COMPANY** mode: `company` (required), optionally `company_domain`, `country`

## Invocation

```bash
adskills linkedin audience --account acme \
  --csv ./abm/q2-targets.csv \
  --name "Q2 ABM — Enterprise Targets" \
  --type COMPANY
```

## Guardrails

- Raw emails are SHA-256 hashed client-side before upload
- `sourcePlatform=API`, `sourceType=USER_UPLOADED` (LinkedIn TOS)
- Dry-run flag available for preview
- Matching on LinkedIn's side can take 24-48h; segment will be empty until processed
