# SimLab — Interactive Simulations

Science experiment simulations organized by **Grade 1–8**, inspired by [PhET](https://phet.colorado.edu/).

## Stack (sim interactives)

- **React** — UI, controls, play/pause/reset
- **Canvas 2D** — animation and rendering
- **Model / view split** — physics & logic in plain TS functions; Canvas only draws

No p5.js, PixiJS, Three.js, or Phaser.

## Flow

1. **Home** — featured sims + grade cards  
2. **Simulations** (`/simulations`) — **Grade panel** (1–8) + sims for the selected grade  
3. **Play** (`/play/:id`) — experiment detail page  
4. **About** (`/about`)

## Grade 8 chapters (interactive)

- **Ch 1 Ecology** — carbon–oxygen cycle, food web, ecological pyramid, predator–prey, global warming  
- **Ch 2 Nervous system** — reflex arc, neuron signal, brain mapping  
- **Ch 3 Heredity** — mitosis/meiosis, DNA zoom, Punnett square  
- **Ch 4 Biotechnology** — plasmid insertion, fermentation  

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Choose **Grade 8**, then open a simulation.

## Add simulations

1. Add metadata in `src/data/simulations.ts`  
2. Build a Canvas sim under `src/sims/` (model + React view)  
3. Register it in `src/sims/registry.ts`
