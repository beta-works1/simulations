# SimLab — Interactive Simulations

A PhET-inspired web application for browsing science and math simulations, aligned with Punjab SNC grade bands.

**Stack:** Vite + React + TypeScript (SPA). Deployed at [simulations-ivory.vercel.app](https://simulations-ivory.vercel.app).

## Features

- Home page with hero carousel and featured sims
- `/simulations` browse page — search, subject + grade filters, skeletons, empty state
- Simulation detail pages — fullscreen viewer shell, learning goals, related sims
- Shared header: logo + **Simulations** only (desktop & mobile)
- Per-route meta / Open Graph via `react-helmet-async`
- Self-hosted Roboto (`@fontsource/roboto`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/   # Header, Footer, grids, viewer, SEO meta
  pages/        # Home, Simulations, Simulation detail
  data/         # Simulation catalog (Punjab SNC grades)
```

## Adding Simulations

Edit `src/data/simulations.ts`. Interactive embeds will plug into `SimulationViewer` later.
