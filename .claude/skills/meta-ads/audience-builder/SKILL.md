---
name: meta-ads-audience-builder
description: Build Meta custom audiences from CSV files (CRM leads, email/phone lists, WhatsApp contacts). Hashes PII client-side (SHA-256, normalized per Meta spec) before upload. Triggers on prompts about uploading leads/contacts/lists as custom audiences on Meta.
---

# Meta Ads — Audience Builder

## When to use

- "Sobe essa lista CSV como custom audience no Meta"
- "Cria uma audiência dos leads do CRM na conta acme"
- "Upload these WhatsApp contacts as a Meta custom audience"
- "Bulk hash and upload emails to audience 'Hot Leads Abril'"

## Input

- **CSV file** with columns matching one or more of: `email`, `phone`/`telefone`/`celular`/`whatsapp`, `first_name`/`nome`, `last_name`/`sobrenome`
- **Audience name** (required)
- **Account ref** from `config/accounts.json`
- Optional: description

## Execution

```bash
adskills meta audience \
  --account acme \
  --csv ./leads/abril-hot.csv \
  --name "Hot Leads — Abril 2026" \
  --description "Top-tier leads from CRM exported 2026-04-24"
```

## PII handling

- Emails lowercased + trimmed before SHA-256
- Phones normalized to E.164 (Brazilian: strips non-digits, prefixes `55` if missing)
- Names lowercased + trimmed
- **Only the hash leaves the machine** — raw PII never sent to Meta
- CSV file is not copied or cached — read once, hashed, discarded

## Batching

- Default 5000 rows per API call (Meta limit is 10k, keep margin for invalid)
- Each batch report shows `num_received` and `num_invalid_entries` from Meta
- Failed batches do not abort the run — partial success is reported

## Guardrails

- Dry-run flag (`--dry-run`) simulates without creating audience or uploading
- Creates audience with `customer_file_source=USER_PROVIDED_ONLY` (required by Meta TOS for CRM data)
- Refuse if CSV has no recognizable PII columns — print supported headers
