---
name: meta-ads
description: Parent skill for Meta (Facebook/Instagram) Ads operations — campaigns, ad sets, ads, creatives, audiences, insights. Delegates to specialized sub-skills for bulk creative uploads, custom audience builds, fatigue detection, and spend tracking.
---

# Meta Ads — Root Skill

Gate into all Meta Ads operations. Sub-skills:

- **creative-strategy/** — bulk upload creatives (local or Drive), generate copy variations, structure ad sets by angle
- **audience-builder/** — custom audiences from CSV (emails, phones, CRM leads including WhatsApp), lookalikes, behavioral
- **fatigue-monitor/** — detect creative fatigue (CTR decay, frequency cap breach) and suggest pause/rotate
- **spend-tracker/** — budget pacing, monthly projection, burn alerts

## Prerequisites

1. Run `npx adskills init` to complete OAuth and register ad account(s) in `config/accounts.json`
2. `.env` populated with `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
3. Token stored encrypted at `~/.adskills/tokens.json` (unlocked by session password)

## Account selection

Every Meta operation needs an `accountRef` (key in `config/accounts.json`). If user's prompt is ambiguous, ask:

> "Which account? (accounts available: acme, clienteX, clienteY)"

## Destructive action policy

The following require **explicit confirmation** in the current chat:

- Pausing or deleting campaigns, ad sets, ads
- Changing budgets
- Increasing bids by >10%
- Publishing creatives with `status=ACTIVE` (default = `PAUSED`)

Preview the exact change list and wait for "yes" / "confirma".

## Invoking the client

```ts
import { MetaClient } from '../../../src/clients/meta.js';
import { getToken } from '../../../src/core/auth.js';

const token = await getToken('meta.acme', sessionPassword);
const client = new MetaClient({
  accessToken: token.accessToken,
  adAccountId: account.meta.adAccountId,
});
```

## Common pitfalls

- Meta budget values are in **cents of account currency** (divide by 100 for display)
- `act_` prefix is required on `adAccountId` (e.g., `act_1234567890`)
- Image uploads return a `hash`, not a URL — persist the hash to create `adcreatives`
- Long-lived tokens expire in ~60 days; refresh before major operations
