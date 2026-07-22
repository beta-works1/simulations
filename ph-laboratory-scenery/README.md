# pH Laboratory (SceneryStack / PhET framework)

Standalone simulation built with **[SceneryStack](https://scenerystack.org/)** — the same framework family PhET uses (Scenery, Axon, Joist, Sun).

## Run locally

```bash
cd ph-laboratory-scenery
npm install
npm run dev
```

## Build PhET-style downloadable HTML

```bash
npm run build
```

This produces a **single self-contained HTML file** (JS/CSS inlined) and copies it to:

`../public/downloads/ph-laboratory-offline.html`

Users can download that file and open it in a browser with **no install** (works from `file://`).

From the repo root:

```bash
npm run build:ph-lab-offline
```

## In the main SimLab app

Open **pH Laboratory** → **Download HTML (offline)**.
