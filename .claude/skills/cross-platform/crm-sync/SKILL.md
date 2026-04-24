---
name: cross-platform-crm-sync
description: Upload a single CSV of CRM leads/contacts as a custom audience on Meta, Google Ads (customer match), and LinkedIn (DMP segment) simultaneously. All PII is SHA-256 hashed client-side before upload. Triggers on prompts about syncing CRM leads to multiple platforms at once.
---

# Cross-Platform — CRM Sync

## When to use

- "Sobe essa lista de leads como custom audience nas 3 plataformas"
- "Sync this CSV to Meta, Google, and LinkedIn simultaneously"
- "Cria audiência 'Hot Leads' em todas as contas de ads"

## Inputs

- `--csv` — CSV path (supports `email`, `phone`/`telefone`/`whatsapp`, `first_name`, `last_name`, `company`)
- `--name` — audience name (used identically across platforms)
- `--platforms` — comma list (default: `meta,google,linkedin`)
- `--account` — account ref (must have meta/google/linkedin sections in accounts.json)
- `--dry-run` — preview only

## Behavior per platform

- **Meta** — `createCustomAudience` + `addUsers` with SHA-256 email/phone, `USER_PROVIDED_ONLY`
- **Google** — `createUserList` (CONTACT_INFO, FIRST_PARTY) + offline user data job with hashed email/phone
- **LinkedIn** — `createDmpSegment` (USER_EMAIL_LIST) + `uploadSegmentUsers` with SHA256_EMAIL

## Invocation

```bash
adskills cross crm-sync --account coldiq \
  --csv ./leads/abril-hot.csv \
  --name "Hot Leads — Abril 2026" \
  --platforms meta,google,linkedin

# Skip LinkedIn
adskills cross crm-sync --account coldiq --csv ./leads.csv --name "..." \
  --platforms meta,google
```

## Guardrails

- Confirmation prompt lists record count + platforms before execution
- Per-platform failures do not abort the run — report shows which succeeded
- Raw CSV contents never leave the machine in plaintext
- Google jobs are queued asynchronously; match rate will populate over ~24h
