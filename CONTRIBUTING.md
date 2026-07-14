# Contributing — adding a SimLab simulation

SimLab uses **React + Canvas 2D** with a PhET-style **model / view / controller** split.

## Stack (already in the repo)

- Vite + React + TypeScript
- Shared shell: `src/sims/shared/SimShell.tsx`
- Shared controls: `src/sims/shared/Controls.tsx` (`Slider`, `RadioGroup`, `Checkbox`, `ControlPanel`, `InfoTooltip`, …)
- Pointer drag: `src/sims/shared/useCanvasPointer.ts`
- Paint loop: `src/sims/shared/useCanvasLoop.ts` (RAF, cancelled on unmount; keep per-frame state in refs)

## Folder layout

**Prefer topic folders** (not grade folders) for new work:

```text
src/simulations/<topic>/
  model.ts      # pure state + math (no canvas/DOM)
  view.ts       # draw(ctx, w, h, state) only
  <Name>Sim.tsx # React controller: controls + pointer + paint loop
  index.ts      # re-export the Sim component
```

Legacy Grade 8 chapters still live under `src/sims/grade8/<chapter>/`. New sims should not add grade folders.

Grade is **metadata** on the catalog entry (`grades: number[]`), not a folder name.

## Checklist

1. **Model** — pure functions; unit-testable (see `refraction-media/model.test.ts`).
2. **View** — reads model state and draws; no physics mutations.
3. **Controller** — use `ControlSlider` / `ControlRadioGroup` / `ControlToggle` / `InfoTooltip` from `Controls.tsx`; mutate a `stateRef` from canvas drag; throttle React readouts.
4. **Register lazy loader** in `src/sims/registry.ts`.
5. **Catalog entry** in `src/data/simulations.ts`:
   - `id`, `title`, `grade` (primary), `grades` (all applicable), `subject`, `chapter?`, cover image under `public/covers/`.
6. **Cover** — SVG or PNG in `public/covers/<id>.svg`.
7. Optional: add metadata to `src/framework/registry.ts` for framework docs.

## Reference implementation

**Refraction Through Media** (`src/simulations/refraction-media/`) is the proof of concept:

- `model.ts` — Snell’s law, PhET indices, no drawing
- `view.ts` — canvas render
- `RefractionMediaSim.tsx` — shared controls + laser drag

**Grade 6 stub:** `src/simulations/intro-balance-scale/` — proves `grades: [6]` is not locked to Grade 8.

## Tests

```bash
npm test
```

Uses Vitest. Add `*.test.ts` next to pure models.

## Do not

- Add p5 / Pixi / Three / Phaser for these 2D educational sims
- Hardcode “Grade 8 only” in routes or folder structure for new content
- Call `setState` every animation frame — use refs + `useCanvasLoop`
