# Contributing — adding a SimLab simulation

SimLab uses **React + Canvas 2D** with a PhET-style **model / view / controller** split.

## Stack

- Vite + React + TypeScript
- Shared shell: `src/sims/shared/SimShell.tsx`
- Shared controls: `src/sims/shared/Controls.tsx` (`Slider`, `RadioGroup`, `Checkbox`, `ControlPanel`, `InfoTooltip`, …)
- Pointer drag: `src/sims/shared/useCanvasPointer.ts`
- Paint loop: `src/sims/shared/useCanvasLoop.ts` (RAF; keep per-frame state in refs)

Topic sims under `src/simulations/` may still use `src/simulations/shared/` (dark shell + `useRefPaintLoop`); prefer `src/sims/shared/` for new work. Those folders are consolidating.

## Folder layout

**Prefer topic folders** for new work:

```text
src/simulations/<topic>/
  model.ts      # pure state + math (no canvas/DOM/React)
  view.ts       # draw(ctx, w, h, state) only
  <Name>Sim.tsx # React controller: controls + pointer + paint loop
  index.ts      # re-export the Sim component
```

Legacy Grade 8 chapters live under `src/sims/grade8/<chapter>/` as `*Sim.tsx` + `*Model.ts`. Do not add new grade folders.

Grade is **catalog metadata** in `src/data/simulations.ts`, not a path.

## Checklist

1. **Model** — pure functions; unit-testable (see `refraction-media/model.test.ts`).
2. **View** — reads model state and draws; no physics mutations.
3. **Controller** — shared Controls; mutate a `stateRef` from canvas drag; throttle React readouts (never `setState` every frame).
4. Register lazy loader in `src/sims/registry.ts`.
5. Catalog entry in `src/data/simulations.ts` + cover under `public/covers/`.

## Reference

**Refraction Through Media** (`src/simulations/refraction-media/`):

- `model.ts` — Snell’s law, PhET indices, no drawing
- `view.ts` — canvas render
- `RefractionMediaSim.tsx` — shared controls + loop

## Tests

```bash
npm test
```

Vitest. Add `*.test.ts` next to pure models.

## Exceptions

- **Circuits** — graph (nodes/wires), not dynamics engines.
- **Force / floating** — hand-rolled Canvas math; no Matter.js unless a later pass needs real collisions.
- **Star life cycle / black holes** — timed visual phases in the model; Canvas draws states only.

## Do not

- Add p5 / Pixi / Three / Phaser
- Call `setState` every animation frame — use refs + `useCanvasLoop` / `useRefPaintLoop`
- Put canvas/`ctx` imports in `model.ts`
- Add a second registry that duplicates `src/sims/registry.ts` + `src/data/simulations.ts`
