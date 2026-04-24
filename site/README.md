# adskills-site

Next.js 15 (App Router) landing page for [adskills](..).

## Dev

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

## Build

```bash
pnpm build
pnpm start
```

## Stack

- Next 15 + React 19 (RC)
- Tailwind CSS 4 (beta, PostCSS plugin)
- next/font: Fraunces (serif display) + IBM Plex Sans (body) + JetBrains Mono (code)
- Zero runtime deps beyond Next/React

## Deploy

Static export compatible:

```bash
pnpm build
# deploy .next/ to Vercel, or export + upload to S3/Cloudflare Pages
```

## Notes

- Single-page landing, no routing
- All components under `app/components/`, `'use client'` where they use hooks
- Color tokens defined as Tailwind v4 `@theme` in `app/globals.css`
- The `your-org/adskills` GitHub URL is a placeholder — swap before publishing
