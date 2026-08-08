# General Science 8 — Simulation Platform: Master Plan

**Source curriculum:** *General Science 8*, Punjab Curriculum & Textbook Board, Lahore — Single National Curriculum (SNC) 2022, Experimental Edition. 12 units, verified page-by-page (not assumed from a table of contents).

This document is the single source of truth for the simulation product. It is meant to live in the repo (e.g. `docs/01-master-plan.md`) and be read by Cursor at the start of every build phase — the phase prompts in `02-cursor-phase-prompts.md` reference sections of this file instead of repeating them.

---

## A. Design Philosophy — why this plan, and not a generic PhET clone

Before anything else, here's the actual argument for the choices below, since "self-argue and come up with the best plan" was the brief.

1. **Most school simulation platforms fail for one of three reasons: they're not tied to a specific curriculum, they assume a confident student, or they don't survive a bad internet day.** A student opening a generic simulator has to first figure out *what it's for* before they can learn the concept. Every simulation here is built from an actual Student Learning Outcome (SLO), section number, and page number in this specific book — not a generic "reflection of light" demo, but *this book's* plane-mirror characteristics, *this book's* concave/convex mirror cases, *this book's* rainbow explanation. That traceability is the whole point of doing the textbook research first.

2. **One shell, not forty different UIs.** The reference PhET screenshots you shared all share a bone structure: colored header → tab bar for sub-modes → full-bleed canvas → a floating control panel with checkboxes/sliders → a dark bottom bar with home/sound/keyboard/reset. A 13-year-old should only have to learn that chrome *once*. Every simulation in this platform is a "skin" on the same shell — new content, identical controls, identical mental model for "where do I reset," "where do I go fullscreen," "where do I find help."

3. **Guided-first, not sandbox-first.** A free-play sandbox is intimidating to a student who doesn't yet know what they're looking for. Every simulation ships with a short numbered "Guided Steps" walkthrough (mirroring the book's own `Activity X.X` procedure boxes) *and* a "Free Explore" mode for students who want to test their own ideas afterward. This directly answers "self-explanatory and easiest to understand."

4. **Offline is not a phase-6 nice-to-have, it's an architecture decision made on day one.** Many target schools have unreliable or no internet. If offline support is bolted on later, it usually means a rewrite. So the tech stack (below) is chosen specifically so that "works with the wifi off" is true from Phase 0 onward, not promised for later.

5. **Every simulation ends by closing the loop with the book**, not just the screen. After Guided Mode, a recap drawer shows the book's actual **Key Points** for that concept plus a 2–3 question check, so the simulation reinforces exam-relevant content instead of existing as a disconnected toy.

6. **Low-end-device reality.** Many students will share a single classroom tablet or an older Android phone. The rendering choice (Section E) is deliberately a mid-weight 2D canvas library, not a heavy WebGL/physics-engine stack — fast enough to be smooth on weak hardware, simple enough that Cursor can debug it without a graphics-programming detour.

---

## B. The Universal Simulation Framework (the "shell")

Every one of the ~38 simulations mounts inside the same `<SimulationShell>`. Nothing about content-specific logic should ever live in the shell; nothing about shell chrome should ever be re-implemented inside a simulation.

### Layout (desktop, fullscreen — mirrors the PhET reference screenshots)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◀ Library   ⓪9  Reflection & Refraction of Light        ⛶  ⚙  ⓘ      │  ← Header (unit-accent color)
├──────────────────────────────────────────────────────────────────────┤
│   [ Plane Mirror ]  [ Ray Tracer ]  [ Spherical Mirrors ]  [Rainbow]  │  ← Tab bar (only if sim has sub-modes)
├──────────────────────────────────────────────────────────────────────┤
│  Guided Steps ●───○───○───○     Free Explore  ⇄  toggle              │  ← Mode switch
│                                                                        │
│                                                       ┌─────────────┐ │
│                                                       │ Controls    │ │
│                 [ live interactive canvas ]           │ ☐ Show ray  │ │
│                                                       │ ☐ Normal    │ │
│                                                       │ Angle: 32°  │ │
│                                                       │ ▬▬●▬▬▬▬▬▬   │ │
│                                                       └─────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│  🏠 Home   ↺ Reset   🔊 Sound   ⌨ Keyboard      Unit 9 · Light  logo  │  ← Bottom bar
└──────────────────────────────────────────────────────────────────────┘
```

On phone-width screens the control panel collapses to a bottom sheet (chevron pull-up), the tab bar becomes a horizontal scroll, and the fullscreen button becomes the primary "enter simulation" affordance from the library grid.

### Shell components (build once in Phase 0, reuse everywhere)

| Component | Responsibility |
|---|---|
| `SimulationShell` | Mounts header, tab bar, canvas slot, control-panel slot, bottom bar; owns fullscreen state via the Fullscreen API; owns sound-on/off context. |
| `Header` | Back-to-library, unit badge + title, fullscreen toggle, settings, **info popover** showing the exact SLO + book page this sim demonstrates. |
| `TabBar` | Renders only if a sim declares `modes[]` in the registry; pill-style active state, like the PhET Median/Mean & Median/Variability tabs. |
| `ControlPanel` | Floating card slot; sims drop `<Slider>`, `<ToggleSwitch>`, `<Checkbox>`, `<ReadoutBadge>` children into it; auto-collapses on narrow viewports. |
| `GuidedStepsOverlay` | Numbered mission list; highlights which control to touch next; "Free Explore" unlocks everything. |
| `BottomBar` | Home, Reset (calls the sim's `onReset`), Sound, Keyboard-help modal, breadcrumb. |
| `RecapDrawer` | Slides up at the end of Guided Mode: book's **Key Points** (verbatim-sourced, paraphrased into our own copy) + `<QuickCheckQuiz>` (2–3 MCQs) + "Mark as understood" → writes to the progress store. |

### Reusable interaction primitives (`/src/ui`)

| Primitive | Used for |
|---|---|
| `DraggableToken` | Light sources, mirrors, objects, food-web species chips, circuit components — dashed-halo handle on hover, snaps to valid zones, live tooltip while dragging. |
| `Slider` | Angle, pH, current, coil turns, mass, temperature — numeric badge updates live; supports a gradient track (used for the pH scale). |
| `ToggleSwitch` / `Checkbox` | Show/hide overlays (ray lines, force vectors, normal line, labels) without resetting scene state. |
| `StepperScrubber` | Multi-stage processes — mitosis stages, the genetic-engineering pipeline, star life cycle — play/pause/step, named stage markers. |
| `ClassifyDropZone` | Drag-to-bin interactions — reaction types, food-web trophic levels. |
| `HotspotLabel` | Click/tap a region of a diagram (brain parts, periodic-table cell) to pop an info card. |
| `ActivityCallout` | Styled to visually echo the book's own `Activity X.X` boxes, so the sim visually "rhymes" with the page the student already knows. |

---

## C. Design system

**Grounding decision:** rather than inventing a generic ed-tech palette, the platform borrows the textbook's *own* established visual language — it already uses a consistent cyan section-header bar, magenta subheadings, and warm-yellow "Interesting information" callouts across all 169 pages. Reusing that language means the digital platform reads as a continuation of the physical book the student already holds, not a disconnected app.

| Token | Value / direction |
|---|---|
| Base neutrals | Warm off-white canvas background (not stark white — easier on the eyes for a full-screen app), near-black ink for body text |
| Unit accents (12, one per unit) | Derived from the book's own recurring hues, extended into a 12-step accessible (WCAG AA) family — e.g. Ecology → leaf green, Light → amber-to-violet gradient, Electricity & Magnetism → indigo, Our Universe → deep navy + magenta, Acids/Bases/Salts → the pH-scale spectrum itself, Force & Pressure → steel blue, Periodic Table → teal, Chemical Reactions → coral |
| Display type | A rounded, confident geometric-humanist sans for titles and the unit badges — friendly without reading as "childish," legible at a glance from across a classroom |
| UI/body type | A highly legible neutral sans for controls, labels, and body copy |
| Numeric readouts | A tabular-numeral face so live-updating numbers (angle, pH, current) don't jitter in width as digits change |
| Motion | Deliberate, not decorative — ray lines sweep in, panels slide, nothing animates "just because"; **reduced-motion is always respected** |
| Accessibility floor | 4.5:1 minimum contrast, visible keyboard focus rings everywhere, ≥44px touch targets (shared classroom tablets), never color-only for correct/incorrect feedback (always paired with an icon/label) |

---

## D. Tech stack & architecture

| Layer | Choice | Why |
|---|---|---|
| App framework | **React 18 + TypeScript**, **Vite** build tool | Fast HMR for iterative Cursor sessions; native PWA plugin; simple static `dist/` output that doubles as the offline distribution artifact |
| Canvas / 2D rendering | **Konva.js via `react-konva`** | Retained-mode scene graph — easy drag/drop, hit-testing, layering; smooth on low-end Android tablets; far simpler to debug than raw WebGL |
| Optics / geometry math | Hand-written vector modules (`/src/engine/rayTracing.ts`) implementing the law of reflection and Snell's law directly | Reflection/refraction is pure geometry — a physics engine is the wrong tool and would make behavior *less* predictable and harder to align exactly with the book's diagrams |
| Mechanics physics | **Matter.js**, used only in Unit 8 (force sandbox, floating/sinking) | The one unit that genuinely needs rigid-body/buoyancy-style behavior; keeping it scoped to one unit avoids dragging engine complexity into sims that don't need it |
| State management | **Zustand** | Minimal boilerplate; one slim global store (settings, language) + local per-sim stores; persistence middleware maps straight onto IndexedDB |
| Styling | **Tailwind CSS** + a small CSS-variable design-token layer for the 12 unit accents | Fast iteration, consistent spacing scale, trivial per-unit theming |
| Animation | **Framer Motion** for DOM/chrome transitions, Konva's built-in tweening for in-canvas motion | Keeps DOM and canvas animation systems from fighting each other |
| Charts | **Recharts** | Energy-pyramid bars, pH-titration curve |
| Offline / PWA | **vite-plugin-pwa** (Workbox under the hood) | Auto-generates a service worker that precaches the app shell + every simulation's assets |
| Offline persistence | **Dexie.js** over IndexedDB | Per-student local progress (sims completed, quiz scores) with zero backend requirement |
| Optional native packaging | **Tauri** | For computer labs with no internet at all, ever — a one-time installer far lighter than Electron, using the OS's own webview |
| Testing | **Vitest** + Testing Library (unit/component), a handful of **Playwright** smoke flows | Keeps every phase honest — each phase prompt requires tests green before moving on |
| Deployment | Static hosting (Vercel/Netlify/Cloudflare Pages) for the online version; the *same* `dist/` zipped for USB/local-network offline distribution | One build, two distribution channels — no divergent "offline build" to maintain |

### Repo structure

```
/src
  /app                     routing, top-level shell mount
  /shell                   SimulationShell, Header, TabBar, ControlPanel,
                            BottomBar, GuidedStepsOverlay, RecapDrawer
  /ui                      Slider, ToggleSwitch, Checkbox, DraggableToken,
                            ReadoutBadge, StepperScrubber, ClassifyDropZone,
                            HotspotLabel, ActivityCallout, KeyPointsCard,
                            QuickCheckQuiz
  /engine                  konvaHelpers.ts, rayTracing.ts, physicsHelpers.ts
  /simulations
    /unit-01-ecology/{carbon-oxygen-cycle, food-web-builder, energy-pyramid, greenhouse-effect}
    /unit-02-nervous-system/{reflex-arc, brain-map}
    /unit-03-heredity-cell-division/{mitosis-stepper, dna-zoom-model}
    /unit-04-biotechnology/{genetic-engineering-pipeline, fermentation-lab}
    /unit-05-periodic-table/{interactive-table, metal-properties}
    /unit-06-chemical-reactions/{equation-balancer, exo-endo-thermometer, reaction-type-sorter, bonding-builder}
    /unit-07-acids-bases-salts/{ph-indicator-lab, neutralization-titration}
    /unit-08-force-pressure/{balanced-unbalanced-forces, pressure-force-area, water-pressure-depth, floating-sinking}
    /unit-09-light/{plane-mirror, reflection-ray-tracer, spherical-mirrors, prism-dispersion-rainbow, refraction-boundary}
    /unit-10-electricity-magnetism/{circuit-builder, electromagnet-strength, bell-speaker-mechanism, home-wiring-safety}
    /unit-11-technology-in-life/{guided-steam-builds}
    /unit-12-our-universe/{star-life-cycle, galaxy-explorer, black-hole-evidence, space-tech-timeline}
  /data
    simulations-registry.ts   the manifest: {id, unitId, title, modes[], slo[], bookPage, component, priority}
  /store                     useAppStore (settings/language), useProgressStore (IndexedDB-persisted)
  /offline                   service-worker registration, pwa manifest, precache list
```

---

## E. Offline strategy (three tiers)

1. **PWA (primary path).** First load over any internet connection precaches the entire app shell and every simulation's code/assets via a Workbox service worker. After that, the app is installable and fully usable with zero connectivity — a student loads it once at school and can keep using it at home.
2. **On-device progress.** All completion/quiz data lives in IndexedDB. No login and no backend are required for the platform to be useful offline. A "sync when online" layer can be added later without changing this default.
3. **Zero-internet distribution.** Because the Vite build output is 100% static files, the identical `dist/` folder can be zipped for USB/local-network distribution to a computer lab, or wrapped in a lightweight Tauri shell for a double-click desktop app — no cloud dependency at all.

---

## F. Full curriculum → simulation inventory

Every row below is sourced from an actual page of the book (cited), not inferred. `P0` = pilot phase, `P1` = core build phase, `P2` = rounding-out phase.

### Unit 1 — Ecology (book p.1–14)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 1.1 | Carbon–Oxygen Cycle Explorer | Toggle + animate | Toggle photosynthesis / respiration / combustion / decomposition on/off; speed | Fig 1.1–1.2, p.2 | P1 |
| 1.2 | Food Web Builder | Drag-to-connect | Drag species to build chains; "remove a species" cascade | Fig 1.5–1.6, p.4 | P1 |
| 1.3 | Ecological Pyramid & Energy Flow | Slider + stacked chart | Producer population size → energy loss up trophic levels | §1.2.2, p.4 | P2 |
| 1.4 | Greenhouse Effect Simulator | Slider + gauge | CO₂/CH₄/NOₓ concentration → trapped-heat rays → temperature gauge | Fig 1.16–1.17, p.8 | P1 |

### Unit 2 — Human Nervous System (p.15–24)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 2.1 | Reflex Arc Pathway | Click-to-trigger animation | Choose a stimulus; voluntary vs involuntary toggle | Fig 2.6, Activity 2.1, p.20 | P2 |
| 2.2 | Brain Map Explorer | Click hotspots | Click a brain region → linked body function | §2.1, p.15–20 | P2 |

### Unit 3 — Variation, Heredity & Cell Division (p.25–36)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 3.1 | Mitosis Stage Stepper | Stepper/scrubber | Step through interphase → nuclear division → cytokinesis; chromosome counter | Fig 3.4, §3.6, p.30 | P2 |
| 3.2 | DNA → Chromosome → Gene Zoom Model | Click-to-zoom | Zoom from chromosome → double helix → base-pair sequence | Fig 3.2, §3.3, p.28 | P2 |

### Unit 4 — Biotechnology (p.37–45)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 4.1 | Genetic Engineering Pipeline | Stepper/scrubber | Scrub through donor gene → plasmid → recombinant DNA → GM bacterium → protein | Fig 4.2, p.39 | P2 |
| 4.2 | Fermentation Lab | Sliders | Yeast amount / temperature / time → CO₂ bubble & dough-rise animation | §4.2, Fig 4.3, p.39 | P2 |

### Unit 5 — Periodic Table (p.46–56)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 5.1 | Interactive Periodic Table (first 18 elements) | Click hotspots | Click element → symbol, atomic number/mass, electronic configuration, state | Fig 5.1, p.46 | P1 |
| 5.2 | Metals vs Non-metals Property Explorer | Toggle | Pick a property (lustre, conductance, malleability) → real-world demo photos | Fig 5.4–5.5, p.51 | P2 |

### Unit 6 — Chemical Reactions (p.57–75)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 6.1 | **Chemical Equation Balancer** | Drag coefficient steppers | Adjust coefficients; live reactant/product atom-count table | Activity 6.3, p.63 | **P0 (pilot)** |
| 6.2 | Exothermic vs Endothermic Thermometer Lab | Choose reaction | Pick CaO+H₂O vs CaCO₃ decomposition → animated thermometer | Activities 6.5–6.6, p.67 | P1 |
| 6.3 | Reaction Type Sorter | Drag-to-classify | Sort example equations into Combination/Decomposition/Displacement/Double-Displacement/Combustion | §6, p.57–73 | P2 |
| 6.4 | Ionic vs Covalent Bond Builder | Drag electrons | Transfer electrons (NaCl) vs share electrons (H₂, O₂, N₂); auto-draws cross-and-dot diagram | Key Points, p.73 | P2 |

### Unit 7 — Acids, Bases & Salts (p.76–93)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 7.1 | **pH Scale & Indicator Lab** | Slider + live color | 0–14 slider; dip virtual litmus/phenolphthalein/methyl-orange/turmeric strip | Opening pH strip, p.76 | **P0 (pilot)** |
| 7.2 | Neutralization Titration | Drop-by-drop | Add acid to base+phenolphthalein until color discharges; live pH graph | Activity 7.5, p.82 | P1 |
| 7.3 | Uses of Acids/Bases/Salts Sorter | Match-the-pairs | Match substance → real-world use | Fig 7.4, 7.8, p.80/85 | P2 |

### Unit 8 — Force and Pressure (p.94–106)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 8.1 | Balanced vs Unbalanced Force Sandbox | Drag force arrows | Push/pull magnitude and direction on a box | Fig 8.1, p.94 | P1 |
| 8.2 | Pressure = Force/Area Sandbox | Flip orientation | Same block, face vs edge down; sand-depth visual | Activity 8.4, p.97 | P1 |
| 8.3 | Water Pressure vs Depth | Toggle + observe | Punch/seal 3 holes at different heights on a bottle; stream distance vs depth | Activity 8.5, p.99 | P1 |
| 8.4 | Floating & Sinking Density Lab | Drag objects | Drop objects of adjustable density into water; float/sink + displaced volume | §8, p.94–106 | P1 |

### Unit 9 — Reflection & Refraction of Light (p.107–123)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 9.1 | Plane Mirror Image Lab | Drag object | Object position → mirrored image with equal-distance/size annotations | Fig 9.8, p.112 | P1 |
| 9.2 | Law of Reflection Ray Tracer | Drag incident ray | Angle of incidence → normal + reflected ray auto-update with angle readouts | §9.2, p.112 | P1 |
| 9.3 | Concave/Convex Mirror Ray Diagram | Drag object | Object position relative to F and C → real/virtual/upright/inverted image auto-labels | Fig 9.18–9.21, p.119 | P1 |
| 9.4 | **Prism Dispersion & Rainbow Formation** | Drag light source + toggle mode | White light through prism → ROYGBIV spectrum; separate "rainbow in the sky" droplet mode (refraction + internal reflection + dispersion) | Fig 9.15, Activity 9.4, §9.4.4, p.116 | **P0 (pilot)** |
| 9.5 | Refraction at a Boundary | Drag object | Pencil-in-water bent-appearance demo | Opening hook question, p.107 | P2 |

### Unit 10 — Electricity and Magnetism (p.124–136)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 10.1 | Circuit Builder (Ammeter/Voltmeter) | Drag components | Cells/bulbs/switches on a breadboard canvas; live current/voltage readouts | Fig 10.3, Activity 10.1, p.126 | P1 |
| 10.2 | Electromagnet Strength Lab | Sliders | Coil turns & current → live paperclip-count | Activity 10.5, p.132 | P1 |
| 10.3 | Electric Bell / Speaker Mechanism | Stepper/scrubber | Step through the make-break cycle | Fig 10.8–10.9, p.132–133 | P2 |
| 10.4 | Home Wiring Safety Sim | Toggle fault scenario | Toggle "overload"; fuse blows vs no-fuse fire risk | Fig 10.5–10.6, p.129 | P2 |

### Unit 11 — Technology in Everyday Life (p.137–147)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 11.1 | Guided STEAM-Build Companions (bioplastic, soap/toothpaste, solar cooker, wind turbine, UPS) | Step checklist + simplified preview | Follow real procedure; simplified virtual outcome preview for schools lacking materials | §11, p.137–147 | P2 |

### Unit 12 — Our Universe (p.148–160)

| ID | Simulation | Interaction type | Controllable elements | Book reference | Priority |
|---|---|---|---|---|---|
| 12.1 | Star Life-Cycle Simulator | Slider (starting mass) | Protostar → main sequence → red giant/supergiant → white dwarf / neutron star / black hole branch | Fig 12.4, p.151 | P1 |
| 12.2 | Galaxy Types Explorer | Click gallery | Spiral / elliptical / irregular comparison | §12.1, p.148 | P2 |
| 12.3 | Black Hole Evidence Visualizer | Play animation | Orbiting-star wobble; gravitational-wave ripple | Fig 12.7, p.153 | P2 |
| 12.4 | Space Tech Timeline | Scroll/click timeline | Hubble, probes, and resulting everyday technologies | p.158 | P2 |

**Totals:** 38 simulations across 12 units — 3 designated `P0` pilots, 18 `P1`, 17 `P2`.

---

## G. Phased roadmap

| Phase | Scope | Key deliverables | Exit criteria |
|---|---|---|---|
| **0 — Foundation** | No real sim content | Repo scaffold; `SimulationShell` + all chrome; fullscreen/sound/keyboard infra; 12 unit-accent design tokens; simulation registry + auto-generated library page; Zustand + IndexedDB progress store; PWA/service-worker scaffold; **one reference demo simulation** | Can browse the (1-item) library, open the demo, drag a token, toggle a control, go fullscreen, reset, reload fully offline with progress intact |
| **1 — Pilot** | 3 flagship sims: 9.4 Rainbow, 6.1 Equation Balancer, 7.1 pH Lab | `engine/rayTracing.ts`; all 3 sims with Guided + Explore modes and a wired Recap Drawer; tests | Framework proven across 3 different interaction paradigms with zero shell changes; a teacher can complete Guided Mode on each with no help |
| **2 — Physical science batch** | Units 5, 8, 9 (remaining), 10 | ~16 more sims | Registry auto-scales; no jank on a mid-range Android tablet |
| **3 — Life science batch** | Units 1, 2, 3, 4 | ~10 more sims | Stepper/scrubber and drag-to-classify patterns reused with zero new shell components |
| **4 — Universe & Technology batch** | Units 12, 11, remaining 7 | Remaining ~9 sims | Full 38-sim curriculum coverage live |
| **5 — Offline & accessibility hardening** | Cross-cutting | Lighthouse PWA audit; Tauri desktop build; full keyboard-nav pass; reduced-motion & colorblind-safe audit; per-sim bundle-size budget | Lighthouse PWA score ≥95; entire app operable by keyboard alone; survives disconnecting wifi mid-session |
| **6 — Bilingual + pilot** | Cross-cutting | Urdu i18n layer for chrome + Key Points/Quiz text; optional lightweight offline-first teacher progress view; real classroom pilot | Positive pilot feedback from 2–3 schools; Guided-mode copy iterated on observed confusion points |
