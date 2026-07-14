import type { ComponentType } from 'react'
import { lazy } from 'react'

type SimComponent = ComponentType

const loaders: Record<string, () => Promise<{ default: SimComponent }>> = {
  // Grade 8 — Ch 1 Ecology
  'carbon-oxygen-cycle': () =>
    import('./grade8/ecology/CarbonOxygenCycleSim').then((m) => ({ default: m.CarbonOxygenCycleSim })),
  'food-web-builder': () =>
    import('./grade8/ecology/FoodWebBuilderSim').then((m) => ({ default: m.FoodWebBuilderSim })),
  'ecological-pyramid': () =>
    import('./grade8/ecology/EcologicalPyramidSim').then((m) => ({ default: m.EcologicalPyramidSim })),
  'predator-prey': () =>
    import('./grade8/ecology/PredatorPreySim').then((m) => ({ default: m.PredatorPreySim })),
  'global-warming': () =>
    import('./grade8/ecology/GlobalWarmingSim').then((m) => ({ default: m.GlobalWarmingSim })),

  // Grade 8 — Ch 2 Nervous system
  'reflex-arc': () =>
    import('./grade8/nervous/ReflexArcSim').then((m) => ({ default: m.ReflexArcSim })),
  'neuron-signal': () =>
    import('./grade8/nervous/NeuronSignalSim').then((m) => ({ default: m.NeuronSignalSim })),
  'brain-mapping': () =>
    import('./grade8/nervous/BrainMappingSim').then((m) => ({ default: m.BrainMappingSim })),

  // Grade 8 — Ch 3 Heredity
  'mitosis-meiosis': () =>
    import('./grade8/heredity/MitosisMeiosisSim').then((m) => ({ default: m.MitosisMeiosisSim })),
  'dna-chromosome-gene': () =>
    import('./grade8/heredity/DnaZoomSim').then((m) => ({ default: m.DnaZoomSim })),
  'punnett-square': () =>
    import('./grade8/heredity/PunnettSquareSim').then((m) => ({ default: m.PunnettSquareSim })),

  // Grade 8 — Ch 4 Biotechnology
  'plasmid-insertion': () =>
    import('./grade8/biotech/PlasmidInsertionSim').then((m) => ({ default: m.PlasmidInsertionSim })),
  fermentation: () =>
    import('./grade8/biotech/FermentationSim').then((m) => ({ default: m.FermentationSim })),

  // Grade 8 — Ch 5 Periodic Table
  'periodic-table-builder': () =>
    import('./grade8/periodic/PeriodicTableSim').then((m) => ({ default: m.PeriodicTableSim })),
  'metal-nonmetal': () =>
    import('./grade8/periodic/MetalNonmetalSim').then((m) => ({ default: m.MetalNonmetalSim })),

  // Grade 8 — Ch 6 Chemical Reactions
  'balance-equations': () =>
    import('./grade8/reactions/BalanceEquationsSim').then((m) => ({ default: m.BalanceEquationsSim })),
  'exo-endo-thermic': () =>
    import('./grade8/reactions/ExoEndoThermicSim').then((m) => ({ default: m.ExoEndoThermicSim })),
  'ionic-covalent-bonds': () =>
    import('./grade8/reactions/IonicCovalentSim').then((m) => ({ default: m.IonicCovalentSim })),
  'conservation-of-mass': () =>
    import('./grade8/reactions/ConservationOfMassSim').then((m) => ({
      default: m.ConservationOfMassSim,
    })),

  // Grade 8 — Ch 7 Acids, Bases, Salts
  'acids-ph-scale': () =>
    import('./grade8/acids/PhScaleSim').then((m) => ({ default: m.PhScaleSim })),
  'acid-base-neutralization': () =>
    import('./grade8/acids/NeutralizationSim').then((m) => ({ default: m.NeutralizationSim })),
  'natural-indicator': () =>
    import('./grade8/acids/NaturalIndicatorSim').then((m) => ({ default: m.NaturalIndicatorSim })),

  // Grade 8 — Ch 8 Force and Pressure
  'balanced-unbalanced-forces': () =>
    import('./grade8/forces/BalancedForcesSim').then((m) => ({ default: m.BalancedForcesSim })),
  'floating-sinking': () =>
    import('./grade8/forces/FloatingSinkingSim').then((m) => ({ default: m.FloatingSinkingSim })),
  'pressure-force-area': () =>
    import('./grade8/forces/PressureForceAreaSim').then((m) => ({ default: m.PressureForceAreaSim })),
  'hydraulic-lift': () =>
    import('./grade8/forces/HydraulicLiftSim').then((m) => ({ default: m.HydraulicLiftSim })),
  'water-pressure-depth': () =>
    import('./grade8/forces/WaterPressureSim').then((m) => ({ default: m.WaterPressureSim })),

  // Grade 8 — Ch 9 Light (React + Canvas 2D under src/simulations)
  'laws-of-reflection': () =>
    import('../simulations/laws-of-reflection').then((m) => ({ default: m.LawsOfReflectionSim })),
  'regular-vs-diffuse': () =>
    import('../simulations/regular-vs-diffuse').then((m) => ({ default: m.RegularVsDiffuseSim })),
  'plane-mirror-periscope': () =>
    import('../simulations/plane-mirror-periscope').then((m) => ({
      default: m.PlaneMirrorPeriscopeSim,
    })),
  'refraction-media': () =>
    import('../simulations/refraction-media').then((m) => ({ default: m.RefractionMediaSim })),
  'rainbow-dispersion': () =>
    import('../simulations/rainbow-dispersion').then((m) => ({ default: m.RainbowDispersionSim })),
  'curved-mirrors': () =>
    import('../simulations/curved-mirrors').then((m) => ({ default: m.CurvedMirrorsSim })),

  // Grade 8 — Ch 10 Electricity & Magnetism
  'ohm-law-circuit': () =>
    import('../simulations/ohm-law-circuit').then((m) => ({ default: m.OhmLawCircuitSim })),
  'series-parallel': () =>
    import('../simulations/series-parallel').then((m) => ({ default: m.SeriesParallelSim })),
  'short-circuit-fuse': () =>
    import('../simulations/short-circuit-fuse').then((m) => ({ default: m.ShortCircuitFuseSim })),
  'electric-motor': () =>
    import('../simulations/electric-motor').then((m) => ({ default: m.ElectricMotorSim })),
  'speaker-mechanism': () =>
    import('../simulations/speaker-mechanism').then((m) => ({ default: m.SpeakerMechanismSim })),

  // Grade 8 — Ch 11 Technology
  'solar-cooker': () =>
    import('../simulations/solar-cooker').then((m) => ({ default: m.SolarCookerSim })),
  'wind-turbine': () =>
    import('../simulations/wind-turbine').then((m) => ({ default: m.WindTurbineSim })),

  // Grade 8 — Ch 12 Universe
  'star-life-cycle': () =>
    import('../simulations/star-life-cycle').then((m) => ({ default: m.StarLifeCycleSim })),
  'galaxy-types': () =>
    import('../simulations/galaxy-types').then((m) => ({ default: m.GalaxyTypesSim })),
  'black-hole': () =>
    import('../simulations/black-hole').then((m) => ({ default: m.BlackHoleSim })),
  'solar-system-timeline': () =>
    import('../simulations/solar-system-timeline').then((m) => ({
      default: m.SolarSystemTimelineSim,
    })),

  // PhET-inspired recreations (catalog entries; models from .phet-src)
  'projectile-motion': () =>
    import('../simulations/projectile-motion').then((m) => ({ default: m.ProjectileMotionSim })),
  'balancing-act': () =>
    import('../simulations/balancing-act').then((m) => ({ default: m.BalancingActSim })),
  'gravity-and-orbits': () =>
    import('../simulations/gravity-and-orbits').then((m) => ({ default: m.GravityAndOrbitsSim })),
  'build-an-atom': () =>
    import('../simulations/build-an-atom').then((m) => ({ default: m.BuildAnAtomSim })),
  'ph-scale': () =>
    import('./grade8/acids/PhScaleSim').then((m) => ({ default: m.PhScaleSim })),
  'circuit-construction': () =>
    import('../simulations/series-parallel').then((m) => ({ default: m.SeriesParallelSim })),
}

const cache = new Map<string, SimComponent>()

export function getLazySim(id: string): SimComponent | null {
  if (!loaders[id]) return null
  if (!cache.has(id)) cache.set(id, lazy(loaders[id]))
  return cache.get(id) ?? null
}

export function hasInteractiveSim(id: string): boolean {
  return Boolean(loaders[id])
}
