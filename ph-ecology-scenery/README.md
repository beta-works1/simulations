# Food Chain / Food Web (SceneryStack / PhET framework)

Standalone Grade 8 ecology simulation built with **[SceneryStack](https://scenerystack.org/)** — the same framework family PhET uses (Scenery, Axon, Joist, Sun).

## Run locally

```bash
cd ph-ecology-scenery
npm install
npm run dev
```

## Build PhET-style downloadable HTML

```bash
npm run build
```

Output is copied to `../public/downloads/food-web-offline.html` (single self-contained file, works offline from `file://`).

From the repo root:

```bash
npm run build:ecology-offline
```

## In SimLab

The play page embeds the SceneryStack sim via iframe (same pattern as pH Laboratory). Users can also **Download HTML (offline)** from the simulation detail page.
