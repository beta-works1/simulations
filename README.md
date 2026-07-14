# SimLab — Interactive Simulations

Science experiment simulations organized by **Grade 1–10**, inspired by [PhET](https://phet.colorado.edu/).

## Stack (sim interactives)

- **React** — UI, controls, play/pause/reset
- **Canvas 2D** — animation and rendering
- **Model / view split** — physics & logic in plain TS functions; Canvas only draws

No p5.js, PixiJS, Three.js, or Phaser.

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for how to add a simulation using the shared framework.

## Flow

1. **Home** — featured sims + grade cards
2. **Simulations** (`/simulations`) — **Grade panel** (1–10) + sims for the selected grade
3. **Play** (`/play/:id`) — experiment detail page
4. **About** (`/about`)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm test   # model unit tests (e.g. Snell's law)
```

## Add simulations

Follow [CONTRIBUTING.md](./CONTRIBUTING.md): topic folder under `src/simulations/`, shared `Controls`, catalog `grades: number[]`, register in `src/sims/registry.ts`.
