# Ecology Simulations (SceneryStack / PhET framework)

Five Grade 8 ecology sims built with **[SceneryStack](https://scenerystack.org/)**.

| Sim | Offline HTML |
|---|---|
| Carbon–Oxygen Cycle | `carbon-oxygen-cycle-offline.html` |
| Food Web Builder | `food-web-builder-offline.html` |
| Ecological Pyramid | `ecological-pyramid-offline.html` |
| Predator–Prey | `predator-prey-offline.html` |
| Global Warming | `global-warming-offline.html` |

## Dev

```bash
cd ecology-scenery
npm install
npm run dev:carbon    # or :food-web :pyramid :predator :warming
```

## Build all offline HTMLs

```bash
npm run build
```

Copies into `../public/downloads/*-offline.html`.

From repo root:

```bash
npm run build:ecology-offline
```
