# SimLab — Interactive Simulations

PhET-inspired multi-page site for browsing science experiment simulations.

**Stack:** Vite + React + TypeScript · Repo: [beta-works1/simulations](https://github.com/beta-works1/simulations)

## Pages (PhET-style workflow)

1. **Home (`/`)** — hero carousel, Play with Sims, browse-by-subject cards, featured sims  
2. **Simulations (`/simulations`)** — search + subject filters (Physics, Chemistry, Biology, Earth Science, Math)  
3. **Simulation detail (`/simulations/:id`)** — viewer shell, learning goals, related sims  
4. **About (`/about`)** — how the discovery workflow works  

## Nav

- **Simulations** dropdown → All Sims + each subject  
- **About**  
- Inline header search (never covers the logo)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Add simulations later

Edit `src/data/simulations.ts` and plug interactive embeds into `src/components/SimulationViewer.tsx`.
