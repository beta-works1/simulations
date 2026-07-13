# SimLab — Interactive Simulations

PhET-inspired multi-page site for browsing science experiment simulations.

**Stack:** Vite + React + TypeScript · Repo: [beta-works1/simulations](https://github.com/beta-works1/simulations)

## Pages (PhET-style workflow)

1. **Home (`/`)** — hero, subject cards, featured sims  
2. **Simulations hub (`/simulations`)** — pick a subject (Sims)  
3. **Subject + chapters (`/simulations/:subject`)** — left chapter panel, sims for the selected chapter  
4. **Play (`/play/:id`)** — simulation detail / experiment viewer  
5. **About (`/about`)** — how the flow works  

## Add simulations later

Edit `src/data/simulations.ts` — add a `chapter` (if needed) and a `simulation` with `chapterId`, then embed the interactive content in `SimulationViewer`.
