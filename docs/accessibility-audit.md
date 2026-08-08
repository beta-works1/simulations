# GS8 Accessibility Audit

Date: 2026-07-26

Method: code review against shared shell (`SimulationShell`) and UI primitives (`src/ui`). Every curriculum sim mounts through the shell, so keyboard focus rings, mode tabs, and reduced-motion CSS apply globally. Spot-checks were done on pilots (prism, equation balancer, pH lab) plus a sample of Phase 2–4 sims.

\* Colorblind column: pass when state is not color-only (text label, ✓/✗, pattern, or readout). Spectrum colours in light sims are content, not sole state feedback.

| Simulation | Keyboard | Reduced motion | Colorblind-safe | Notes |
|---|---|---|---|---|
| `reference-demo` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `prism-dispersion-rainbow` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `equation-balancer` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `ph-indicator-lab` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `interactive-periodic-table` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `balanced-unbalanced-forces` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `pressure-force-area` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `water-pressure-depth` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `floating-sinking` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `plane-mirror` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `reflection-ray-tracer` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `spherical-mirrors` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `circuit-builder` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `electromagnet-strength` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `carbon-oxygen-cycle` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `food-web-builder` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `greenhouse-effect` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `ecological-pyramid` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `reflex-arc` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `brain-map` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `mitosis-stepper` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `dna-zoom` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `genetic-engineering-pipeline` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `fermentation-lab` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `star-life-cycle` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `neutralization-titration` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `exo-endo-thermometer` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `reaction-type-sorter` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `bonding-builder` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `refraction-boundary` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `electric-bell` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `home-wiring-safety` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `galaxy-explorer` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `black-hole-evidence` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `space-tech-timeline` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `uses-sorter` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `metal-properties` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |
| `steam-builds` | pass | pass | pass* | Shared Slider/Toggle/Checkbox/Tab focus rings; shell reduced-motion; status uses text+icon where color is used |

## Fixes applied in Phase 5
- Header settings: Reduce motion toggle + `prefers-reduced-motion` sync
- Shell CSS: animation/transition kill-switch under `data-reduced-motion`
- QuickCheckQuiz: Correct/Try again text + ✓/✗ marks (not color alone)
- Equation balancer already labels Balanced ✓ / Unbalanced in the atom table

## Remaining watch items
- DraggableToken keyboard repositioning is limited (focusable; arrow nudges recommended in a follow-up if classroom tablets rely on keyboard-only)
- Full manual pass on every tablet in the pilot classroom still required (see `docs/pilot-checklist.md`)
