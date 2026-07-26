import {
  chapterIdFromTitle,
  simulations,
  type Grade,
  type Simulation,
} from './simulations'

/**
 * Subject groupings for the homepage. Every subject is defined by the Grade 8
 * textbook chapters it maps to plus named sims from Grades 1-7, so counts and
 * examples are always read from the real catalog instead of being hand-written.
 */
export interface Subject {
  id: string
  name: string
  /** One plain line about what a student actually does in these sims. */
  blurb: string
  /** CSS variable name for this subject's accent tone. */
  accent: string
  /** Darker sibling of the accent, used for text on the light page background. */
  accentInk: string
  chapters: string[]
  extraIds: string[]
  /** Where the row links to. */
  href: string
}

const SUBJECT_DEFS: Subject[] = [
  {
    id: 'physics',
    name: 'Physics',
    blurb: 'Push, float, bend a light beam, and close a circuit until the fuse blows.',
    accent: '--gas-300',
    accentInk: '--gas-ink',
    chapters: [
      'Ch 8 – Force and Pressure',
      'Ch 9 – Light: Reflection & Refraction',
      'Ch 10 – Electricity & Magnetism',
      'Ch 11 – Technology in Everyday Life',
    ],
    extraIds: ['balancing-act', 'circuit-construction', 'projectile-motion'],
    href: `/simulations?grade=8&chapter=${chapterIdFromTitle('Ch 8 – Force and Pressure')}`,
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    blurb: 'Build atoms, balance equations, and titrate an acid until the colour flips.',
    accent: '--ember-400',
    accentInk: '--ember-ink',
    chapters: [
      'Ch 5 – Periodic Table',
      'Ch 6 – Chemical Reactions',
      'Ch 7 – Acids, Bases, Salts',
    ],
    extraIds: ['build-an-atom', 'ph-scale'],
    href: `/simulations?grade=8&chapter=${chapterIdFromTitle('Ch 6 – Chemical Reactions')}`,
  },
  {
    id: 'biology',
    name: 'Biology',
    blurb: 'Wire a reflex arc, cut a food web, and watch a population crash and recover.',
    accent: '--sage-500',
    accentInk: '--sage-ink',
    chapters: [
      'Ch 1 – Ecology',
      'Ch 2 – Human Nervous System',
      'Ch 3 – Variation, Heredity, Cell Division',
      'Ch 4 – Biotechnology',
    ],
    extraIds: ['plant-life', 'natural-selection'],
    href: `/simulations?grade=8&chapter=${chapterIdFromTitle('Ch 1 – Ecology')}`,
  },
  {
    id: 'earth-space',
    name: 'Earth & Space',
    blurb: 'Thicken the gas blanket, age a star, and slingshot a moon out of orbit.',
    accent: '--sun-500',
    accentInk: '--sun-ink',
    chapters: ['Ch 12 – Our Universe'],
    extraIds: ['gravity-and-orbits', 'global-warming', 'carbon-oxygen-cycle'],
    href: `/simulations?grade=8&chapter=${chapterIdFromTitle('Ch 12 – Our Universe')}`,
  },
  {
    id: 'math',
    name: 'Math',
    blurb: 'Match fractions, tilt a beam back to balance, and drag a line to fit its equation.',
    accent: '--terra-400',
    accentInk: '--terra-ink',
    chapters: [],
    extraIds: ['fraction-matcher', 'graphing-lines', 'counting-1-to-20', 'shapes-and-colors'],
    href: '/simulations?grade=3',
  },
]

export interface SubjectGroup extends Subject {
  items: Simulation[]
  count: number
  /** Grades this subject actually has sims for. */
  grades: Grade[]
}

function collect(def: Subject): Simulation[] {
  const chapterSet = new Set(def.chapters)
  const extras = new Set(def.extraIds)
  const seen = new Set<string>()
  const out: Simulation[] = []

  for (const sim of simulations) {
    const matches = (sim.chapter && chapterSet.has(sim.chapter)) || extras.has(sim.id)
    if (!matches || seen.has(sim.id)) continue
    seen.add(sim.id)
    out.push(sim)
  }
  return out
}

export const SUBJECT_GROUPS: SubjectGroup[] = SUBJECT_DEFS.map((def) => {
  const items = collect(def)
  return {
    ...def,
    items,
    count: items.length,
    grades: [...new Set(items.map((s) => s.grade))].sort((a, b) => a - b),
  }
})
