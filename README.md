# SimLab — Interactive Simulations

Powered by Beta Works.

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
- **Ch 2 Nervous system** — reflex arc, neuron signal, brain mapping (SceneryStack offline HTML)  
- **Ch 3 Heredity** — mitosis/meiosis, DNA zoom, Punnett square  
- **Ch 4 Biotechnology** — plasmid insertion, fermentation  

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Choose **Grade 8**, then open a simulation.

### GS8 Phase 0 platform (new shell)

Curriculum rebuild lives beside the existing catalog:

- Library (1 reference demo): [http://localhost:5173/gs8](http://localhost:5173/gs8)
- UI primitives playground: [http://localhost:5173/gs8/ui](http://localhost:5173/gs8/ui)
- Specs: [`docs/01-master-plan.md`](docs/01-master-plan.md), [`docs/02-cursor-phase-prompts.md`](docs/02-cursor-phase-prompts.md)

```bash
npm test   # Vitest (pure model tests + Phase 0 foundation tests)
npm run build
```

#### Offline check (PWA)

```bash
npm run build && npm run preview
```

Open the preview URL → DevTools → Network → **Offline** → reload. `/gs8` and the reference demo should still load. Mark the demo “understood,” reload — completion should persist (IndexedDB).

## Final PCTB Labs (standalone HTML)

Twelve Class 8 science labs ship as single-file HTML under [`public/final-sims/`](public/final-sims/):

- Catalog: [Final simulations](https://simulations-one.vercel.app/simulations?grade=8&chapter=final-pctb-labs) (same card grid as Grade 8)
- Hub: [`/final-sims/`](https://simulations-one.vercel.app/final-sims/)

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
