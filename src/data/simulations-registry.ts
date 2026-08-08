import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import type { UnitId } from './unitTokens'

export type SimPriority = 'P0' | 'P1' | 'P2'

export interface SimulationRegistryEntry {
  id: string
  unitId: UnitId
  unitName: string
  unitNumber: number
  title: string
  modes?: string[]
  slo: string[]
  bookPage: number
  priority: SimPriority
  component: LazyExoticComponent<ComponentType>
}

type Spec = Omit<SimulationRegistryEntry, 'component'> & {
  load: () => Promise<{ default: ComponentType }>
}

function entry(spec: Spec): SimulationRegistryEntry {
  return {
    id: spec.id,
    unitId: spec.unitId,
    unitName: spec.unitName,
    unitNumber: spec.unitNumber,
    title: spec.title,
    modes: spec.modes,
    slo: spec.slo,
    bookPage: spec.bookPage,
    priority: spec.priority,
    component: lazy(spec.load),
  }
}

export const simulationsRegistry: SimulationRegistryEntry[] = [
  entry({
    id: 'reference-demo',
    unitId: 'unit-09',
    unitName: 'Reflection & Refraction of Light',
    unitNumber: 9,
    title: 'Reference Demo — Ball on a Track',
    slo: ['Prove the GS8 shell end-to-end.'],
    bookPage: 0,
    priority: 'P0',
    load: () =>
      import('../simulations/_reference-demo').then((m) => ({ default: m.ReferenceDemoSim })),
  }),
  entry({
    id: 'prism-dispersion-rainbow',
    unitId: 'unit-09',
    unitName: 'Reflection & Refraction of Light',
    unitNumber: 9,
    title: 'Prism Dispersion & Rainbow',
    modes: ['Prism', 'Rainbow'],
    slo: ['Explain prism dispersion (Fig 9.15).', 'Relate rainbows to droplet optics (§9.4.4).'],
    bookPage: 116,
    priority: 'P0',
    load: () =>
      import('../simulations/unit-09-light/prism-dispersion-rainbow').then((m) => ({
        default: m.PrismDispersionRainbowSim,
      })),
  }),
  entry({
    id: 'equation-balancer',
    unitId: 'unit-06',
    unitName: 'Chemical Reactions',
    unitNumber: 6,
    title: 'Chemical Equation Balancer',
    slo: ['Balance equations (Activity 6.3, p.63).'],
    bookPage: 63,
    priority: 'P0',
    load: () =>
      import('../simulations/unit-06-chemical-reactions/equation-balancer').then((m) => ({
        default: m.EquationBalancerSim,
      })),
  }),
  entry({
    id: 'ph-indicator-lab',
    unitId: 'unit-07',
    unitName: 'Acids, Bases & Salts',
    unitNumber: 7,
    title: 'pH Scale & Indicator Lab',
    slo: ['Read pH zones and indicator colours (p.76).'],
    bookPage: 76,
    priority: 'P0',
    load: () =>
      import('../simulations/unit-07-acids-bases-salts/ph-indicator-lab').then((m) => ({
        default: m.PhIndicatorLabSim,
      })),
  }),
  // Phase 2
  entry({
    id: 'interactive-periodic-table',
    unitId: 'unit-05',
    unitName: 'Periodic Table',
    unitNumber: 5,
    title: 'Interactive Periodic Table',
    slo: ['Identify symbol, Z, mass, configuration for first 18 elements (Fig 5.1).'],
    bookPage: 46,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-05-periodic-table/interactive-table').then((m) => ({
        default: m.InteractivePeriodicTableSim,
      })),
  }),
  entry({
    id: 'balanced-unbalanced-forces',
    unitId: 'unit-08',
    unitName: 'Force and Pressure',
    unitNumber: 8,
    title: 'Balanced vs Unbalanced Forces',
    slo: ['Compare balanced and unbalanced forces on an object (Fig 8.1).'],
    bookPage: 94,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-08-force-pressure/balanced-unbalanced-forces').then((m) => ({
        default: m.BalancedUnbalancedForcesSim,
      })),
  }),
  entry({
    id: 'pressure-force-area',
    unitId: 'unit-08',
    unitName: 'Force and Pressure',
    unitNumber: 8,
    title: 'Pressure = Force / Area',
    slo: ['Relate pressure to force and area (Activity 8.4).'],
    bookPage: 97,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-08-force-pressure/pressure-force-area').then((m) => ({
        default: m.PressureForceAreaSim,
      })),
  }),
  entry({
    id: 'water-pressure-depth',
    unitId: 'unit-08',
    unitName: 'Force and Pressure',
    unitNumber: 8,
    title: 'Water Pressure vs Depth',
    slo: ['Show that liquid pressure increases with depth (Activity 8.5).'],
    bookPage: 99,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-08-force-pressure/water-pressure-depth').then((m) => ({
        default: m.WaterPressureDepthSim,
      })),
  }),
  entry({
    id: 'floating-sinking',
    unitId: 'unit-08',
    unitName: 'Force and Pressure',
    unitNumber: 8,
    title: 'Floating & Sinking Density Lab',
    slo: ['Relate floating/sinking to density comparison with water.'],
    bookPage: 104,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-08-force-pressure/floating-sinking').then((m) => ({
        default: m.FloatingSinkingSim,
      })),
  }),
  entry({
    id: 'plane-mirror',
    unitId: 'unit-09',
    unitName: 'Reflection & Refraction of Light',
    unitNumber: 9,
    title: 'Plane Mirror Image Lab',
    slo: ['Show equal object/image distance in a plane mirror (Fig 9.8).'],
    bookPage: 112,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-09-light/plane-mirror').then((m) => ({
        default: m.PlaneMirrorSim,
      })),
  }),
  entry({
    id: 'reflection-ray-tracer',
    unitId: 'unit-09',
    unitName: 'Reflection & Refraction of Light',
    unitNumber: 9,
    title: 'Law of Reflection Ray Tracer',
    slo: ['Verify angle of incidence equals angle of reflection (§9.2).'],
    bookPage: 112,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-09-light/reflection-ray-tracer').then((m) => ({
        default: m.ReflectionRayTracerSim,
      })),
  }),
  entry({
    id: 'spherical-mirrors',
    unitId: 'unit-09',
    unitName: 'Reflection & Refraction of Light',
    unitNumber: 9,
    title: 'Concave / Convex Mirror Ray Diagram',
    slo: ['Predict image nature for spherical mirrors (Fig 9.18–9.21).'],
    bookPage: 119,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-09-light/spherical-mirrors').then((m) => ({
        default: m.SphericalMirrorsSim,
      })),
  }),
  entry({
    id: 'circuit-builder',
    unitId: 'unit-10',
    unitName: 'Electricity and Magnetism',
    unitNumber: 10,
    title: 'Circuit Builder',
    slo: ['Build a simple circuit and read current/voltage (Activity 10.1).'],
    bookPage: 126,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-10-electricity-magnetism/circuit-builder').then((m) => ({
        default: m.CircuitBuilderSim,
      })),
  }),
  entry({
    id: 'electromagnet-strength',
    unitId: 'unit-10',
    unitName: 'Electricity and Magnetism',
    unitNumber: 10,
    title: 'Electromagnet Strength Lab',
    slo: ['Relate coil turns and current to electromagnet strength (Activity 10.5).'],
    bookPage: 132,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-10-electricity-magnetism/electromagnet-strength').then((m) => ({
        default: m.ElectromagnetStrengthSim,
      })),
  }),

  // Phase 3 — life science
  entry({
    id: 'carbon-oxygen-cycle',
    unitId: 'unit-01',
    unitName: 'Ecology',
    unitNumber: 1,
    title: 'Carbon–Oxygen Cycle Explorer',
    slo: ['Trace CO₂/O₂ exchange via photosynthesis, respiration, combustion.'],
    bookPage: 2,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-01-ecology/carbon-oxygen-cycle').then((m) => ({
        default: m.CarbonOxygenCycleSim,
      })),
  }),
  entry({
    id: 'food-web-builder',
    unitId: 'unit-01',
    unitName: 'Ecology',
    unitNumber: 1,
    title: 'Food Web Builder',
    slo: ['Build food chains and see cascade effects.'],
    bookPage: 4,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-01-ecology/food-web-builder').then((m) => ({
        default: m.FoodWebBuilderSim,
      })),
  }),
  entry({
    id: 'greenhouse-effect',
    unitId: 'unit-01',
    unitName: 'Ecology',
    unitNumber: 1,
    title: 'Greenhouse Effect Simulator',
    slo: ['Link greenhouse gas concentration to trapped heat.'],
    bookPage: 8,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-01-ecology/greenhouse-effect').then((m) => ({
        default: m.GreenhouseEffectSim,
      })),
  }),
  entry({
    id: 'ecological-pyramid',
    unitId: 'unit-01',
    unitName: 'Ecology',
    unitNumber: 1,
    title: 'Ecological Pyramid & Energy Flow',
    slo: ['Show energy loss across trophic levels.'],
    bookPage: 4,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-01-ecology/ecological-pyramid').then((m) => ({
        default: m.EcologicalPyramidSim,
      })),
  }),
  entry({
    id: 'reflex-arc',
    unitId: 'unit-02',
    unitName: 'Human Nervous System',
    unitNumber: 2,
    title: 'Reflex Arc Pathway',
    slo: ['Trace a reflex pathway from stimulus to response.'],
    bookPage: 20,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-02-nervous-system/reflex-arc').then((m) => ({
        default: m.ReflexArcSim,
      })),
  }),
  entry({
    id: 'brain-map',
    unitId: 'unit-02',
    unitName: 'Human Nervous System',
    unitNumber: 2,
    title: 'Brain Map Explorer',
    slo: ['Link brain regions to body functions.'],
    bookPage: 15,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-02-nervous-system/brain-map').then((m) => ({
        default: m.BrainMapSim,
      })),
  }),
  entry({
    id: 'mitosis-stepper',
    unitId: 'unit-03',
    unitName: 'Variation, Heredity & Cell Division',
    unitNumber: 3,
    title: 'Mitosis Stage Stepper',
    slo: ['Step through mitosis stages.'],
    bookPage: 30,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-03-heredity-cell-division/mitosis-stepper').then((m) => ({
        default: m.MitosisStepperSim,
      })),
  }),
  entry({
    id: 'dna-zoom',
    unitId: 'unit-03',
    unitName: 'Variation, Heredity & Cell Division',
    unitNumber: 3,
    title: 'DNA → Chromosome → Gene Zoom',
    slo: ['Zoom from chromosome to base pairs.'],
    bookPage: 28,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-03-heredity-cell-division/dna-zoom').then((m) => ({
        default: m.DnaZoomSim,
      })),
  }),
  entry({
    id: 'genetic-engineering-pipeline',
    unitId: 'unit-04',
    unitName: 'Biotechnology',
    unitNumber: 4,
    title: 'Genetic Engineering Pipeline',
    slo: ['Follow recombinant DNA steps.'],
    bookPage: 39,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-04-biotechnology/genetic-engineering-pipeline').then((m) => ({
        default: m.GeneticEngineeringPipelineSim,
      })),
  }),
  entry({
    id: 'fermentation-lab',
    unitId: 'unit-04',
    unitName: 'Biotechnology',
    unitNumber: 4,
    title: 'Fermentation Lab',
    slo: ['Link yeast, temperature, and time to fermentation.'],
    bookPage: 39,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-04-biotechnology/fermentation-lab').then((m) => ({
        default: m.FermentationLabSim,
      })),
  }),
  // Phase 4
  entry({
    id: 'star-life-cycle',
    unitId: 'unit-12',
    unitName: 'Our Universe',
    unitNumber: 12,
    title: 'Star Life-Cycle Simulator',
    slo: ['Predict stellar endpoints from starting mass.'],
    bookPage: 151,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-12-our-universe/star-life-cycle').then((m) => ({
        default: m.StarLifeCycleSim,
      })),
  }),
  entry({
    id: 'neutralization-titration',
    unitId: 'unit-07',
    unitName: 'Acids, Bases & Salts',
    unitNumber: 7,
    title: 'Neutralization Titration',
    slo: ['Watch pH change during acid–base titration.'],
    bookPage: 82,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-07-acids-bases-salts/neutralization-titration').then((m) => ({
        default: m.NeutralizationTitrationSim,
      })),
  }),
  entry({
    id: 'exo-endo-thermometer',
    unitId: 'unit-06',
    unitName: 'Chemical Reactions',
    unitNumber: 6,
    title: 'Exothermic vs Endothermic Lab',
    slo: ['Contrast heat release and absorption in reactions.'],
    bookPage: 67,
    priority: 'P1',
    load: () =>
      import('../simulations/unit-06-chemical-reactions/exo-endo-thermometer').then((m) => ({
        default: m.ExoEndoThermometerSim,
      })),
  }),
  entry({
    id: 'reaction-type-sorter',
    unitId: 'unit-06',
    unitName: 'Chemical Reactions',
    unitNumber: 6,
    title: 'Reaction Type Sorter',
    slo: ['Classify reaction types.'],
    bookPage: 57,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-06-chemical-reactions/reaction-type-sorter').then((m) => ({
        default: m.ReactionTypeSorterSim,
      })),
  }),
  entry({
    id: 'bonding-builder',
    unitId: 'unit-06',
    unitName: 'Chemical Reactions',
    unitNumber: 6,
    title: 'Ionic vs Covalent Bond Builder',
    slo: ['Compare electron transfer and sharing.'],
    bookPage: 73,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-06-chemical-reactions/bonding-builder').then((m) => ({
        default: m.BondingBuilderSim,
      })),
  }),
  entry({
    id: 'refraction-boundary',
    unitId: 'unit-09',
    unitName: 'Reflection & Refraction of Light',
    unitNumber: 9,
    title: 'Refraction at a Boundary',
    slo: ['Show bending of light / apparent depth.'],
    bookPage: 107,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-09-light/refraction-boundary').then((m) => ({
        default: m.RefractionBoundarySim,
      })),
  }),
  entry({
    id: 'electric-bell',
    unitId: 'unit-10',
    unitName: 'Electricity and Magnetism',
    unitNumber: 10,
    title: 'Electric Bell / Speaker Mechanism',
    slo: ['Step through the make–break cycle.'],
    bookPage: 132,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-10-electricity-magnetism/electric-bell').then((m) => ({
        default: m.ElectricBellSim,
      })),
  }),
  entry({
    id: 'home-wiring-safety',
    unitId: 'unit-10',
    unitName: 'Electricity and Magnetism',
    unitNumber: 10,
    title: 'Home Wiring Safety',
    slo: ['Explain fuse protection under overload.'],
    bookPage: 129,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-10-electricity-magnetism/home-wiring-safety').then((m) => ({
        default: m.HomeWiringSafetySim,
      })),
  }),
  entry({
    id: 'galaxy-explorer',
    unitId: 'unit-12',
    unitName: 'Our Universe',
    unitNumber: 12,
    title: 'Galaxy Types Explorer',
    slo: ['Compare spiral, elliptical, and irregular galaxies.'],
    bookPage: 148,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-12-our-universe/galaxy-explorer').then((m) => ({
        default: m.GalaxyExplorerSim,
      })),
  }),
  entry({
    id: 'black-hole-evidence',
    unitId: 'unit-12',
    unitName: 'Our Universe',
    unitNumber: 12,
    title: 'Black Hole Evidence Visualizer',
    slo: ['Visualize orbital wobble and gravitational-wave hints.'],
    bookPage: 153,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-12-our-universe/black-hole-evidence').then((m) => ({
        default: m.BlackHoleEvidenceSim,
      })),
  }),
  entry({
    id: 'space-tech-timeline',
    unitId: 'unit-12',
    unitName: 'Our Universe',
    unitNumber: 12,
    title: 'Space Tech Timeline',
    slo: ['Connect space missions to everyday technology.'],
    bookPage: 158,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-12-our-universe/space-tech-timeline').then((m) => ({
        default: m.SpaceTechTimelineSim,
      })),
  }),
  entry({
    id: 'uses-sorter',
    unitId: 'unit-07',
    unitName: 'Acids, Bases & Salts',
    unitNumber: 7,
    title: 'Uses of Acids / Bases / Salts',
    slo: ['Match substances to everyday uses.'],
    bookPage: 80,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-07-acids-bases-salts/uses-sorter').then((m) => ({
        default: m.UsesSorterSim,
      })),
  }),
  entry({
    id: 'metal-properties',
    unitId: 'unit-05',
    unitName: 'Periodic Table',
    unitNumber: 5,
    title: 'Metals vs Non-metals Properties',
    slo: ['Compare lustre, conductance, malleability.'],
    bookPage: 51,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-05-periodic-table/metal-properties').then((m) => ({
        default: m.MetalPropertiesSim,
      })),
  }),
  entry({
    id: 'steam-builds',
    unitId: 'unit-11',
    unitName: 'Technology in Everyday Life',
    unitNumber: 11,
    title: 'Guided STEAM-Build Companions',
    slo: ['Follow simplified STEAM build checklists.'],
    bookPage: 137,
    priority: 'P2',
    load: () =>
      import('../simulations/unit-11-technology-in-life/steam-builds').then((m) => ({
        default: m.SteamBuildsSim,
      })),
  }),
]

export function getSimulation(id: string) {
  return simulationsRegistry.find((s) => s.id === id)
}
