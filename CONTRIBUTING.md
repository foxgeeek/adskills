# Contributing to AdSkills

## Dev setup

```bash
pnpm install
cp .env.example .env
cp config/accounts.example.json config/accounts.json
```

## Running

```bash
pnpm dev <command>        # tsx, watches nothing
pnpm build                # emits dist/
pnpm test                 # vitest
pnpm test:watch
pnpm lint
pnpm format
```

## Code conventions

- **Strict TypeScript** — `strict: true`, `noUncheckedIndexedAccess: true`. Cast to `unknown` first when bridging loose API shapes.
- **No `any`** except for third-party protobuf/REST shapes that fight the type system — cast with a named interface at the call site.
- **Dedicated tools over generic helpers** — use `MetaClient`, `GoogleAdsClient`, `LinkedInClient` methods; don't hand-roll `fetch` from commands.
- **Destructive actions require confirmation** — every command that mutates ads (pause, delete, bid, budget, audience write) MUST prompt via `prompts({ type: 'confirm' })` before the API call, unless `--dry-run` is set.
- **Default ad status is PAUSED** — only go ACTIVE when the user passes `--status ACTIVE`.
- **Micros conversion** — Meta budgets in cents, Google micros = × 10⁶. Convert at the client boundary, never leak raw values into reports.
- **SHA-256 PII hashing at the client** — raw email/phone NEVER sent to any ad platform. Use `src/utils/hash-pii.ts`.

## Adding a new skill

1. Create `.claude/skills/<platform>/<skill>/SKILL.md` with frontmatter (`name`, `description`) and the standard sections (when to use, inputs, execution, guardrails)
2. Create `src/commands/<platform>-<skill>.ts` with the command function
3. Wire in `src/commands/cli.ts`
4. Add tests in `src/<dir>/__tests__/<name>.test.ts` for any pure utilities
5. Update README status section

## Commit style

Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Keep the subject ≤ 72 chars, include a short body explaining why.

## PR checklist

- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] No raw PII values end up in logs, reports, or API calls that shouldn't receive them
- [ ] Every new mutating command has a confirmation prompt or `--dry-run` path tested
- [ ] README updated if the public CLI changed

## Security policy

- Never commit `.env`, `config/accounts.json`, or anything under `~/.adskills/`
- Token store is AES-256-GCM with scrypt-derived key — if you touch `src/core/auth.ts`, do NOT alter the encryption scheme without a migration plan for existing users
- If you discover a vulnerability, open a private issue instead of a public PR
