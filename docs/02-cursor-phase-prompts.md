# Cursor Implementation Prompts — General Science 8 Simulation Platform

**How to use this file:**
1. Put both `01-master-plan.md` and this file in your repo at `docs/`.
2. Open Cursor in the repo root. Paste **one phase at a time**, in order. Don't skip ahead — each phase's Definition of Done gates the next one.
3. After each phase, actually run the Definition of Done checks yourself before starting the next prompt. Cursor will say it's done; verify it.
4. Section F of the master plan is the spec sheet for every simulation. Phases 2–4 use the reusable **Simulation Build Template** (bottom of this file) plus one row of that table at a time — don't paste all 38 specs into one giant prompt, Cursor works far better on one focused sim at a time.

---

## Phase 0 — Framework Foundation

```
Read docs/01-master-plan.md in full before starting, especially Sections B (Framework), C (Design System), D (Tech Stack), and E (Offline Strategy). Everything below must match what's specified there — don't invent an alternate architecture.

GOAL: Build the reusable application shell and infrastructure. Zero real curriculum content yet — just the chrome, the data model, and one throwaway reference simulation that proves the pattern end-to-end.

TASKS:
1. Scaffold a Vite + React 18 + TypeScript project. Add Tailwind CSS and configure the 12 unit-accent design tokens as CSS variables per Section C.
2. Build the repo structure exactly as laid out in Section D's "Repo structure" block. Create empty folders with a `.gitkeep` where content doesn't exist yet.
3. Implement `/src/shell/SimulationShell.tsx` and its children (`Header`, `TabBar`, `ControlPanel`, `BottomBar`, `GuidedStepsOverlay`, `RecapDrawer`) per the component table in Section B. `Header` must include a working Fullscreen API toggle, a settings popover (stub is fine for now), and an info popover that reads a sim's SLO/book-page metadata from the registry.
4. Implement the shared primitives in `/src/ui` from Section B's interaction-primitive table: `DraggableToken`, `Slider`, `ToggleSwitch`, `Checkbox`, `StepperScrubber`, `ClassifyDropZone`, `HotspotLabel`, `ActivityCallout`, `KeyPointsCard`, `QuickCheckQuiz`, `ReadoutBadge`. Each needs Storybook-less but isolated usage examples in a `/src/ui/__playground__` route so they can be sanity-checked without a real simulation.
5. Create `/src/data/simulations-registry.ts` with the exact shape: `{ id, unitId, unitName, title, modes?: string[], slo: string[], bookPage: number, priority: "P0"|"P1"|"P2", component: React.LazyExoticComponent<...> }`. Seed it with ONE entry: a reference demo sim.
6. Build that one reference demo simulation at `/src/simulations/_reference-demo/`: a simple scene with one `DraggableToken` (a ball on a track) and one `Slider` that changes its position, with a working Guided Steps sequence (2 steps) and a Recap Drawer with 1 dummy Key Point and 1 dummy quiz question. This exists purely to prove every shell piece works together.
7. Build `/src/app` — a library/home screen that reads the registry and renders simulation cards grouped by unit, color-coded per the unit-accent tokens, and routes into `SimulationShell` on click.
8. Set up `/src/store`: `useAppStore` (Zustand, settings + language stub) and `useProgressStore` (Zustand + Dexie.js persistence middleware) that records `{ simId, completedGuidedMode: boolean, quizScore }`.
9. Set up `/src/offline`: install and configure `vite-plugin-pwa` with `registerType: 'autoUpdate'`, precaching the full build output. Add a PWA manifest (name, icons placeholder, theme colors from the design tokens).
10. Write a short `README.md` explaining how to run dev, build, and test the offline behavior locally (build, serve the `dist/` folder, then disconnect network in devtools).

CONSTRAINTS:
- No simulation-specific logic anywhere outside `/src/simulations/_reference-demo`.
- Don't add any 2D canvas library yet beyond installing `react-konva` as a dependency — Phase 0 doesn't need real canvas rendering beyond the one simple demo.
- Keep the design tokens data-driven (one config object), not hardcoded per component.

DEFINITION OF DONE (verify all of these yourself):
- `npm run dev` shows a library page with exactly one simulation card.
- Opening it shows the full shell: header with working fullscreen toggle, bottom bar with working reset, a Guided Steps flow that completes into the Recap Drawer.
- `npm run build && npm run preview`, then disable network in devtools and reload — the app still loads and the demo sim still works.
- Reloading after marking the demo "understood" still shows it as completed (IndexedDB persistence works).
- `npm run test` passes (add at least one test per shell component).
```

---

## Phase 1 — Pilot Simulations (3 flagship sims, diverse interaction types)

```
Read docs/01-master-plan.md Section F, rows 9.4, 6.1, and 7.1, before starting. Phase 0 must already be merged and its Definition of Done verified — if `/src/shell` or `/src/ui` don't exist yet, stop and say so instead of proceeding.

GOAL: Build three simulations that deliberately stress-test the shell against three different interaction paradigms, to prove the framework generalizes before we scale to 35 more. Do NOT modify anything in `/src/shell` or `/src/ui` while building these — if you find yourself needing to, stop and flag it as a shell gap instead of forking a one-off variant inside a simulation folder.

SIMULATION 1 — `unit-09-light/prism-dispersion-rainbow` (row 9.4):
- Build `/src/engine/rayTracing.ts` first: pure functions implementing the law of reflection (angle in = angle out about the normal) and Snell's law refraction, given an incident ray vector and a surface normal. These must be unit-testable in isolation with no rendering involved.
- Two modes (use the shell's TabBar): "Prism" (Fig 9.15) — draggable white-light source, prism renders 7 exiting rays (ROYGBIV) at correct relative angles computed from rayTracing.ts — and "Rainbow" (§9.4.4) — a single water droplet cross-section showing refraction on entry, one internal reflection, refraction on exit, fanning into a spectrum, matching Activity 9.4's setup.
- Controls: light source angle/position slider, toggle for "show normal line," toggle for "show angle labels."
- Guided Steps: (1) drag the light source to hit the prism, (2) toggle the normal line and read the angle, (3) switch to Rainbow mode and observe the same physics in a droplet.
- Recap: Key Points = "white light is a mixture of 7 colours (ROYGBIV)," "a rainbow is dispersion + internal reflection in water droplets." Quiz: 2 MCQs in the book's own style.

SIMULATION 2 — `unit-06-chemical-reactions/equation-balancer` (row 6.1):
- Render an unbalanced equation (start with the book's own worked example: CaCl₂ + Na₂CO₃ → CaCO₃ + NaCl) with drag/click coefficient steppers on each species.
- Live atom-count table exactly mirroring the book's layout: Reactants | Products | Balanced/Unbalanced per element, auto-updating as coefficients change, with a green check when fully balanced.
- Include a small bank of 4 additional equations of increasing difficulty (pull from the book's Mini Exercise on p.63) the student can cycle through in Explore mode.
- Guided Steps walk through the book's own two-step balancing method (balance one element at a time, note which are already balanced).
- Recap: Key Points = Law of Conservation of Mass wording from p.63, quiz = 2 balance-checking MCQs.

SIMULATION 3 — `unit-07-acids-bases-salts/ph-indicator-lab` (row 7.1):
- A 0–14 slider (styled with the book's own pH-scale color gradient from the opening page) that dips a virtual strip into a solution.
- Four indicator types the student can switch between (litmus, phenolphthalein, methyl orange, turmeric paper), each changing color per the book's actual described behavior (e.g. bases turn red litmus blue, phenolphthalein pink; turmeric paper turns brown with bases).
- A zone label (Strong acid / Weak acid / Neutral / Weak alkali / Strong alkali) that updates live under the slider, matching the ranges given on the book's opening page (0–2, 3–6, 7, 8–11, 12–14).
- Guided Steps: (1) set pH to 2 and observe litmus, (2) set pH to 12 and observe phenolphthalein, (3) find neutral.
- Recap: Key Points = pH ranges table, quiz = 2 MCQs identifying acid/alkali from indicator behavior.

SHARED REQUIREMENTS FOR ALL THREE:
- Register each in `simulations-registry.ts` with correct `unitId`, `slo[]`, and `bookPage`.
- Each gets a Vitest test asserting the core computed behavior (ray angle math for #1, balanced/unbalanced detection for #2, correct zone label for a given pH for #3) — not just that the component renders.
- All three must be fully keyboard-operable (tab to a slider, arrow keys to adjust) — this is the accessibility baseline every future simulation must also meet.

DEFINITION OF DONE:
- All three sims appear in the library under the correct unit colors.
- Guided Mode completes without dead ends on all three; Explore Mode unlocks every listed control.
- `npm run test` passes, including the three new math/logic tests.
- Reload with network disabled in devtools still works for all three.
- No changes were made to `/src/shell` or `/src/ui` — if any were necessary, they're called out explicitly in your summary rather than silently included.
```

---

## The Simulation Build Template (reuse for every remaining simulation, Phases 2–4)

Copy this once per simulation. Fill in the bracketed values from the matching row in `01-master-plan.md` Section F.

```
Read docs/01-master-plan.md → Section F → row [ID] for the full spec (interaction type, controllable elements, book reference). Also skim the Phase 1 reference implementation at src/simulations/unit-09-light/prism-dispersion-rainbow (or whichever pilot sim is most similar in interaction type) for the file-structure and Guided/Recap wiring pattern — match it exactly.

Build simulation [ID]: "[TITLE]" for Unit [N] ([UNIT NAME]).

TASKS:
1. Create src/simulations/unit-[NN]-[unit-slug]/[sim-slug]/ containing at minimum: index.tsx, [SimName]Canvas.tsx, [SimName]Controls.tsx, [simName].guidedSteps.ts, [simName].content.ts (Key Points paraphrased from book p.[PAGE], plus 2–3 quiz questions in the book's own MCQ style).
2. Register it in src/data/simulations-registry.ts with unitId, slo[], bookPage, priority "[P0/P1/P2]".
3. Implement the canvas using [react-konva for draggable/visual scenes | Matter.js for this unit's mechanics content | SVG for simple diagrams] — pick per the interaction type in the spec row.
4. Wire every controllable element listed in the spec row as a live, user-driven parameter. No canned/scripted animations that ignore user input — if the book shows a relationship (e.g. pressure = force/area, or angle in = angle out), that relationship must actually be computed from the current control values, not faked.
5. Implement Guided Steps (3–6 steps, following the book's own Activity procedure where one exists) and Free Explore mode (all controls unlocked at once).
6. Wire the RecapDrawer with the Key Points and Quick Check for this sim.
7. Write a Vitest test asserting the core state/behavior (not just "it renders") — e.g. dragging a value changes a computed output in the scientifically correct direction.

CONSTRAINTS:
- Do not modify anything in /src/shell or /src/ui. If this simulation seems to need a new shared primitive, stop and flag it rather than building a one-off local version.
- Keep everything for this simulation inside its own folder.
- All formulas/behavior must be scientifically correct per the cited book section — cite the section number in a code comment where a formula is implemented.

DEFINITION OF DONE:
- Appears correctly in the library grid under the right unit color.
- Guided Mode completes with no dead ends; Explore Mode allows free manipulation of every listed control.
- npm run test passes.
- Works after a hard reload with devtools network set to Offline.
```

---

## Phase 2 — Physical Science Batch (Units 5, 8, 9 remaining, 10)

```
Phase 1 must be complete and verified. Build the following simulations one at a time, in this order, using the Simulation Build Template above for each — do not batch them into a single commit/response, finish and verify one before starting the next:

1. [5.1] Interactive Periodic Table
2. [8.1] Balanced vs Unbalanced Force Sandbox
3. [8.2] Pressure = Force/Area Sandbox
4. [8.3] Water Pressure vs Depth
5. [8.4] Floating & Sinking Density Lab
6. [9.1] Plane Mirror Image Lab
7. [9.2] Law of Reflection Ray Tracer (reuse engine/rayTracing.ts from Phase 1 — do not reimplement the math)
8. [9.3] Concave/Convex Mirror Ray Diagram (also reuse engine/rayTracing.ts, extended for curved-surface normals if needed — extend the module, don't fork it)
9. [10.1] Circuit Builder with Ammeter/Voltmeter
10. [10.2] Electromagnet Strength Lab

After all ten are built: confirm the library page still loads quickly (check bundle size per route — each simulation should be code-split and lazy-loaded, not bundled into one giant chunk), and confirm nothing added to /src/shell or /src/ui along the way. Report which (if any) simulations needed a genuinely new shared primitive, and why.
```

---

## Phase 3 — Life Science Batch (Units 1, 2, 3, 4)

```
Phase 2 must be complete and verified. Build the following, one at a time, using the Simulation Build Template:

1. [1.1] Carbon–Oxygen Cycle Explorer
2. [1.2] Food Web Builder (this is the first use of ClassifyDropZone/DraggableToken for a many-node graph — if performance suffers with ~9 species nodes on a low-end device profile, say so before optimizing further)
3. [1.4] Greenhouse Effect Simulator
4. [2.1] Reflex Arc Pathway
5. [3.1] Mitosis Stage Stepper (first real use of StepperScrubber — confirm it's flexible enough for a 3-stage process here and a 5-stage process in Unit 12 later)
6. [4.1] Genetic Engineering Pipeline
7. [1.3] Ecological Pyramid & Energy Flow
8. [2.2] Brain Map Explorer
9. [3.2] DNA → Chromosome → Gene Zoom Model
10. [4.2] Fermentation Lab

Confirm at the end: StepperScrubber and ClassifyDropZone/DraggableToken patterns from this batch required zero new shell components. If any did, flag it explicitly.
```

---

## Phase 4 — Universe & Technology Batch (Units 12, 11, remaining Unit 7)

```
Phase 3 must be complete and verified. Build the following, one at a time, using the Simulation Build Template:

1. [12.1] Star Life-Cycle Simulator
2. [7.2] Neutralization Titration
3. [6.2] Exothermic vs Endothermic Thermometer Lab
4. [6.3] Reaction Type Sorter
5. [6.4] Ionic vs Covalent Bond Builder
6. [9.5] Refraction at a Boundary
7. [10.3] Electric Bell / Speaker Mechanism
8. [10.4] Home Wiring Safety Sim
9. [12.2] Galaxy Types Explorer
10. [12.3] Black Hole Evidence Visualizer
11. [12.4] Space Tech Timeline
12. [7.3] Uses of Acids/Bases/Salts Sorter
13. [5.2] Metals vs Non-metals Property Explorer
14. [11.1] Guided STEAM-Build Companions (bioplastic, soap/toothpaste, solar cooker, wind turbine, UPS) — these are step-checklist + simplified-preview experiences, not full physics sims; keep them lightweight per the master plan's description of this unit.

After this phase: all 38 simulations from Section F of the master plan should exist and be registered. Generate a short report cross-checking the registry against the master plan's table and flag any row that's missing, mis-tagged with the wrong unit/priority, or missing a bookPage citation.
```

---

## Phase 5 — Offline, Accessibility & Performance Hardening

```
All 38 simulations must exist before starting this phase.

TASKS:
1. Run a Lighthouse PWA audit against the production build. Fix whatever's needed to reach a PWA score ≥95 — likely precache-list gaps, missing manifest icons, or missing offline fallback routing.
2. Add a Tauri wrapper around the existing dist/ output for an offline desktop build (per Section E, Tier 3 of the master plan). Confirm it launches and every simulation works with the machine's network adapter disabled.
3. Do a full keyboard-navigation pass across all 38 simulations: every DraggableToken, Slider, Checkbox, and tab must be reachable and operable via Tab/Arrow keys/Enter/Space alone, with a visible focus ring. Log and fix any simulation that fails this.
4. Add a reduced-motion mode (respect prefers-reduced-motion; also exposable via the Header settings popover) that disables non-essential canvas animation across every simulation, without breaking the underlying interactivity.
5. Do a colorblind-safe audit: for every simulation using color to convey state (correct/incorrect, balanced/unbalanced, pH zones, reaction type bins), confirm there's a redundant non-color cue (icon, label, pattern) already in place; fix any that rely on color alone.
6. Add a per-route bundle-size budget check to the build (fail CI if any single simulation's lazy-loaded chunk exceeds a reasonable threshold — propose one based on the current largest chunk and justify it).
7. Profile on a throttled CPU (devtools 4x slowdown) + throttled network profile and note/fix any simulation that drops below smooth interaction.

DEFINITION OF DONE:
- Lighthouse PWA score ≥95, documented in a short report.
- A working Tauri build artifact.
- A checklist file (docs/accessibility-audit.md) listing every simulation with a pass/fail for keyboard nav, reduced motion, and colorblind-safe feedback, with fixes applied for any failures.
```

---

## Phase 6 — Bilingual Layer + Optional Teacher View + Pilot Readiness

```
Phase 5 must be complete and verified.

TASKS:
1. Add an i18n scaffold (e.g. react-i18next) covering all shell chrome strings and every simulation's Key Points + Quiz content. Provide an English/Urdu toggle in the Header settings popover. Urdu strings should be added as a structured translation file per simulation (translation content itself can be filled in incrementally — the infrastructure is the deliverable here).
2. Confirm RTL layout handling works correctly when Urdu is selected (control panel side, text alignment, tab bar direction) without needing per-simulation special-casing — this should be handled once at the shell level.
3. Build an optional, offline-first "teacher view": a simple local aggregate of the progress store data (which simulations a device has completed, quiz scores) — no account system, no server requirement, exportable as a simple file (e.g. CSV/JSON) a teacher could collect from a classroom set of tablets.
4. Prepare a short pilot checklist doc (docs/pilot-checklist.md): what to observe when 2–3 real classrooms use this (where students get stuck in Guided Mode, which simulations run slow on their actual hardware, which Urdu strings are missing or awkward), and a lightweight way to log that feedback back into the repo as issues.

DEFINITION OF DONE:
- Switching language in Header settings changes all shell chrome and at least the pilot-phase simulations' Key Points/Quiz text, with correct RTL layout.
- Teacher view shows real data from the progress store and can export it.
- docs/pilot-checklist.md exists and is usable by a non-developer running the pilot.
```
