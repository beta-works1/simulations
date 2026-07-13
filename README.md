# SimLab — Interactive Simulations

A PhET-inspired web application for browsing and running science and math experiment simulations.

## Features

- **PhET-style design** — Header, navigation, hero carousel, simulation grid, and footer modeled after [PhET Colorado](https://phet.colorado.edu/)
- **Simulations page** — Browse, search, and filter simulations by subject (Physics, Chemistry, Biology, Earth & Space, Math)
- **Simulation detail pages** — Placeholder viewer ready for embedding interactive sims
- **Responsive layout** — Works on desktop and mobile

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/   # Header, Footer, HeroCarousel, SimulationGrid, Logo
  pages/        # HomePage, SimulationsPage, SimulationDetailPage
  data/         # Simulation catalog
```

## Adding Simulations

Edit `src/data/simulations.ts` to add new entries. Each simulation needs an `id`, `title`, `subject`, `description`, and color theme.
