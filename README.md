# SimLab — Interactive Simulations

Science experiment simulations organized by **Grade 1–8**.

## Flow

1. **Home** — featured sims + grade cards  
2. **Simulations** (`/simulations`) — **Grade panel** (1–8) + sims for the selected grade  
3. **Play** (`/play/:id`) — experiment detail page  
4. **About** (`/about`)

## Run

```bash
npm install
npm run dev
```

## Add simulations

Edit `src/data/simulations.ts` and set `grade: 1` … `8`. Embed interactives in `SimulationViewer`.
