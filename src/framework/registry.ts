/**
 * SimLab simulation framework — metadata & registry helpers.
 *
 * New sims: put Model + View under `src/simulations/<topic>/` (subject/topic folders,
 * not grade folders). Register a lazy loader in `src/sims/registry.ts` and a catalog
 * entry in `src/data/simulations.ts` with `grades: number[]` and `subject`.
 *
 * See CONTRIBUTING.md for the full checklist.
 */

import type { ComponentType } from 'react'
import type { Grade, SimSubject } from '../data/simulations'

export interface SimulationDefinition {
  id: string
  title: string
  subject: SimSubject
  /** Grades this sim applies to (can be more than one). */
  grades: Grade[]
  description: string
  thumbnail: string
  chapter?: string
  /** Lazy component loader — prefer registering in sims/registry.ts. */
  load?: () => Promise<{ default: ComponentType }>
}

/** Framework-only registry (stubs + reference sims). Catalog UI still uses data/simulations.ts. */
export const FRAMEWORK_SIMS: SimulationDefinition[] = [
  {
    id: 'refraction-media',
    title: 'Refraction Through Media',
    subject: 'physics',
    grades: [8, 9],
    description: "Snell's law at an air boundary using PhET Bending Light indices.",
    thumbnail: '/covers/refraction-media.svg',
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    load: () =>
      import('../simulations/refraction-media').then((m) => ({ default: m.RefractionMediaSim })),
  },
  {
    id: 'intro-balance-scale',
    title: 'Balance Scale (Intro)',
    subject: 'physics',
    grades: [6],
    description: 'Placeholder Grade 6 stub proving the registry is not locked to Grade 8.',
    thumbnail: '/covers/intro-balance-scale.svg',
    chapter: 'Intro – Forces',
    load: () =>
      import('../simulations/intro-balance-scale').then((m) => ({
        default: m.IntroBalanceScaleSim,
      })),
  },
]

export function frameworkSimById(id: string): SimulationDefinition | undefined {
  return FRAMEWORK_SIMS.find((s) => s.id === id)
}
