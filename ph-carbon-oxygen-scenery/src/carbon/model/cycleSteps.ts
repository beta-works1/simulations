/**
 * Grade-8 “how the carbon–oxygen cycle works” tour — five steps from the
 * classroom poster: plants → breathing → decay → oceans → burning fuels.
 * NEXT lines are always student actions (drag / add / toggle).
 */

export type CycleStepId =
  | 'plants'
  | 'breathe'
  | 'decay'
  | 'ocean'
  | 'burn'
  | 'free'

export interface CycleStepDef {
  id: CycleStepId
  /** Short button label */
  label: string
  /** Guide banner title */
  guideTitle: string
  /** Guide banner body */
  guideBody: string
  now: string
  why: string
  next: string
  /** Preset environment when the step is selected */
  preset: {
    isDay: boolean
    sunlight: number
    plants: number
    animals: number
    factories: number
    ocean: number
  }
}

export const CYCLE_STEPS: readonly CycleStepDef[] = [
  {
    id: 'plants',
    label: '1 Plants',
    guideTitle: 'Step 1 — Plants make oxygen',
    guideBody: 'Drag trees onto the grass. In sunlight they take CO₂ and release O₂.',
    now: 'Your trees are making oxygen.',
    why: 'Sunlight + plants turn CO₂ and water into food and release O₂.',
    next: 'Drag 2–3 animals onto the grass to see breathing.',
    preset: { isDay: true, sunlight: 95, plants: 5, animals: 1, factories: 0, ocean: 4 },
  },
  {
    id: 'breathe',
    label: '2 Breathe',
    guideTitle: 'Step 2 — Animals breathe out',
    guideBody: 'Drag cows or deer onto the meadow. They use O₂ and breathe out CO₂.',
    now: 'Your animals are breathing out CO₂.',
    why: 'Living things use O₂ for energy and return CO₂ to the air.',
    next: 'Tap the soil, or add more trees (more dead leaves → decay).',
    preset: { isDay: true, sunlight: 70, plants: 4, animals: 5, factories: 0, ocean: 4 },
  },
  {
    id: 'decay',
    label: '3 Decay',
    guideTitle: 'Step 3 — Decay returns carbon',
    guideBody: 'Dead leaves and soil life break down and release CO₂. Tap the brown soil.',
    now: 'Decay is returning carbon.',
    why: 'Fungi and bacteria break down dead plants and animals → CO₂.',
    next: 'Raise Ocean strength, or tap the ocean — CO₂ dissolves there.',
    preset: { isDay: true, sunlight: 55, plants: 6, animals: 2, factories: 0, ocean: 5 },
  },
  {
    id: 'ocean',
    label: '4 Ocean',
    guideTitle: 'Step 4 — Oceans absorb CO₂',
    guideBody: 'The blue strip is the ocean sink. Stronger ocean = more CO₂ pulled from air.',
    now: 'Oceans are taking in CO₂.',
    why: 'CO₂ dissolves in seawater — a natural sink.',
    next: 'Drag factories onto the right side to see burning fuels.',
    preset: { isDay: true, sunlight: 75, plants: 4, animals: 2, factories: 1, ocean: 12 },
  },
  {
    id: 'burn',
    label: '5 Burn',
    guideTitle: 'Step 5 — Burning fuels',
    guideBody: 'Drag factories in. They burn fuel, use O₂, and dump lots of CO₂.',
    now: 'Your factories are adding CO₂.',
    why: 'Burning coal and oil releases stored carbon as CO₂.',
    next: 'Free play — drag agents, or try a challenge card.',
    preset: { isDay: true, sunlight: 80, plants: 3, animals: 2, factories: 3, ocean: 5 },
  },
]

export function cycleStepById(id: CycleStepId): CycleStepDef | undefined {
  return CYCLE_STEPS.find((s) => s.id === id)
}

/** Dominant process for free-play triad when no tour step is locked. */
export type DominantProcess =
  | 'photosynthesis'
  | 'respiration'
  | 'decomposition'
  | 'ocean'
  | 'combustion'
  | 'balanced'

export function dominantProcess(rates: {
  photosynthesis: number
  respiration: number
  decomposition: number
  oceanAbsorb: number
  combustion: number
}): DominantProcess {
  const entries: [DominantProcess, number][] = [
    ['photosynthesis', rates.photosynthesis],
    ['respiration', rates.respiration],
    ['decomposition', rates.decomposition],
    ['ocean', rates.oceanAbsorb],
    ['combustion', rates.combustion],
  ]
  entries.sort((a, b) => b[1] - a[1])
  const [top, topV] = entries[0]
  const second = entries[1][1]
  if (topV < 0.8 || topV < second * 1.15) return 'balanced'
  return top
}

export function triadForDominant(d: DominantProcess): [string, string, string] {
  switch (d) {
    case 'photosynthesis':
      return [
        'Your trees are making oxygen.',
        'Sunlight + plants turn CO₂ into food and release O₂.',
        'Drag animals in, or toggle Night, to reverse the gases.',
      ]
    case 'respiration':
      return [
        'Your animals are breathing out CO₂.',
        'Living things use O₂ and return CO₂ to the air.',
        'Tap the soil or add trees so decay can return carbon.',
      ]
    case 'decomposition':
      return [
        'Decay is returning carbon.',
        'Fungi and bacteria break down dead things → CO₂.',
        'Tap the ocean or raise Ocean strength.',
      ]
    case 'ocean':
      return [
        'Oceans are taking in CO₂.',
        'CO₂ dissolves in ocean water — a natural sink.',
        'Drag factories in to overwhelm the sinks.',
      ]
    case 'combustion':
      return [
        'Your factories are adding CO₂.',
        'Coal and oil release stored carbon as CO₂.',
        'Drag factories out or add more trees to restore balance.',
      ]
    default:
      return [
        'The cycle is roughly balanced.',
        'Plants, breathing, decay, oceans, and burning roughly cancel out.',
        'Drag trees, animals, or factories to tip the balance.',
      ]
  }
}
