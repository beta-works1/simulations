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
