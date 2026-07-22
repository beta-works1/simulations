# SimLab — Interactive Simulations

Science experiment simulations organized by **Grade 1–8**, inspired by [PhET](https://phet.colorado.edu/).

## Stack (sim interactives)

- **React** — UI, controls, play/pause/reset
- **Canvas 2D** — animation and rendering
- **Model / view / controller** — physics & logic in plain TS; Canvas only draws; React wires controls

No p5.js, PixiJS, Three.js, or Phaser. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full checklist.

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

```bash
npm test   # Vitest (pure model tests)
npm run build
```

## Offline download (PhET-style)

**pH Laboratory** also has a SceneryStack build you can download as a single HTML file:

- In the app: open the sim → **Download HTML (offline)**
- Or open [`/downloads/ph-laboratory-offline.html`](public/downloads/ph-laboratory-offline.html) after building:

```bash
npm run build:ph-lab-offline
```

See [`ph-laboratory-scenery/README.md`](ph-laboratory-scenery/README.md).

## Add simulations

1. Follow [CONTRIBUTING.md](CONTRIBUTING.md) — prefer `src/simulations/<topic>/{model,view,*Sim}.ts(x)`
2. Add metadata in `src/data/simulations.ts`
3. Register the lazy loader in `src/sims/registry.ts`
4. Add a cover under `public/covers/`
