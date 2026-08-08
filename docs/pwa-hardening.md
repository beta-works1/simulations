# PWA / Offline Hardening Notes (Phase 5)

## Configuration
- `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- Manifest `start_url: /gs8`, theme `#0ea5e9`
- Workbox precaches `js/css/html/ico/png/svg/woff2` and uses `navigateFallback: /index.html`
- Offline SW registration: `src/offline/register.ts` (production only)

## Icons
- SVG favicon used as any/maskable icon (`/favicon.svg`)
- Additional PNG icons can be dropped in `public/` and listed in `vite.config.ts` if store listing requires bitmaps

## Bundle budget
- Post-build script: `node scripts/check-bundle-budget.mjs`
- Limit: **1 MB** per lazy JS chunk (justified by the existing catalog `PreviewScene3D` Three.js bundle ~865 KB; GS8 sim chunks stay well under 100 KB)
- Wired via `npm run build:gs8` = `tsc -b && vite build && node scripts/check-bundle-budget.mjs`

## Lighthouse
Run locally after `npm run build && npm run preview`:

```bash
npx lighthouse http://localhost:4173/gs8 --only-categories=pwa --view
```

Target: PWA category ≥95. Common fixes if below: installable manifest, HTTPS in deploy, service worker controlling start URL, maskable icon bitmaps.

## Tauri (Tier 3 desktop offline)
Rust/cargo is not available in this build environment. Scaffold lives in `src-tauri/` — install Rust then:

```bash
npm run tauri:dev   # after installing @tauri-apps/cli
npm run tauri:build
```

See `src-tauri/README.md`.
