/** React model: placeable agents drive the carbon–oxygen cycle. */

export const HISTORY_MAX = 180
export const CO2_MIN = 5
export const CO2_MAX = 95
export const O2_MIN = 5
export const O2_MAX = 95
export const DAY_NIGHT_PERIOD = 16

export const AGENT_LIMITS = { plant: 8, animal: 6, factory: 4 } as const

export type AgentKind = 'plant' | 'animal' | 'factory'

export interface LandscapeAgent {
  id: string
  kind: AgentKind
  /** 0–1 in land band */
  nx: number
  ny: number
}

export interface GasSample {
  co2: number
  o2: number
}

export interface ProcessRates {
  photosynthesis: number
  respiration: number
  decomposition: number
  combustion: number
  oceanAbsorb: number
}

export type BalanceStatus = 'Balanced' | 'CO₂ rising' | 'O₂ rising'
export type CycleStepId = 'plants' | 'breathe' | 'decay' | 'ocean' | 'burn' | 'free'
export type ChallengeKind = 'none' | 'deforestation' | 'reforestation'

export interface CycleStepDef {
  id: CycleStepId
  label: string
  guideTitle: string
  guideBody: string
  now: string
  why: string
  next: string
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
    guideBody: 'Drag animals onto the meadow. They use O₂ and breathe out CO₂.',
    now: 'Your animals are breathing out CO₂.',
    why: 'Living things use O₂ for energy and return CO₂ to the air.',
    next: 'Tap the soil, or add more trees (more leaf litter → decay).',
    preset: { isDay: true, sunlight: 70, plants: 4, animals: 5, factories: 0, ocean: 4 },
  },
  {
    id: 'decay',
    label: '3 Decay',
    guideTitle: 'Step 3 — Decay returns carbon',
    guideBody: 'Dead leaves and soil life break down and release CO₂. Tap the brown soil.',
    now: 'Decay is returning carbon.',
    why: 'Fungi and bacteria break down dead plants and animals → CO₂.',
    next: 'Raise Ocean strength — CO₂ dissolves in seawater.',
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
    next: 'Free play — drag agents, or try a challenge.',
    preset: { isDay: true, sunlight: 80, plants: 3, animals: 2, factories: 3, ocean: 5 },
  },
]

export interface CarbonOxygenState {
  co2Level: number
  o2Level: number
  sunlightIntensity: number
  isDay: boolean
  autoDayNight: boolean
  oceanStrength: number
  agents: LandscapeAgent[]
  deadMatterAmount: number
  simSpeed: number
  time: number
  history: GasSample[]
  netCo2Rate: number
  netO2Rate: number
  cycleStep: CycleStepId
  challenge: ChallengeKind
  takeaway: string | null
  status: string
}

let agentSeq = 0
function nextId(kind: AgentKind) {
  agentSeq += 1
  return `${kind}-${agentSeq}`
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function countAgents(agents: readonly LandscapeAgent[], kind: AgentKind) {
  return agents.filter((a) => a.kind === kind).length
}

function layoutSlot(kind: AgentKind, index: number, total: number) {
  const t = Math.max(1, total)
  if (kind === 'plant') {
    return { nx: 0.08 + (index / t) * 0.55 + ((index * 17) % 7) * 0.01, ny: 0.2 + ((index * 13) % 5) * 0.08 }
  }
  if (kind === 'animal') {
    return { nx: 0.12 + (index / t) * 0.5, ny: 0.72 + ((index % 2) * 0.08) }
  }
  return { nx: 0.62 + (index / Math.max(1, Math.min(t, 4))) * 0.32, ny: 0.55 + ((index % 2) * 0.1) }
}

export function buildAgents(plants: number, animals: number, factories: number): LandscapeAgent[] {
  const out: LandscapeAgent[] = []
  const p = Math.min(AGENT_LIMITS.plant, Math.round(plants))
  const a = Math.min(AGENT_LIMITS.animal, Math.round(animals))
  const f = Math.min(AGENT_LIMITS.factory, Math.round(factories))
  for (let i = 0; i < p; i++) out.push({ id: nextId('plant'), kind: 'plant', ...layoutSlot('plant', i, p) })
  for (let i = 0; i < a; i++) out.push({ id: nextId('animal'), kind: 'animal', ...layoutSlot('animal', i, a) })
  for (let i = 0; i < f; i++) out.push({ id: nextId('factory'), kind: 'factory', ...layoutSlot('factory', i, f) })
  return out
}

export function createCarbonOxygenState(): CarbonOxygenState {
  return {
    co2Level: 42,
    o2Level: 58,
    sunlightIntensity: 80,
    isDay: true,
    autoDayNight: false,
    oceanStrength: 6,
    agents: buildAgents(5, 3, 1),
    deadMatterAmount: 7,
    simSpeed: 1,
    time: 0,
    history: [{ co2: 42, o2: 58 }],
    netCo2Rate: 0,
    netO2Rate: 0,
    cycleStep: 'free',
    challenge: 'none',
    takeaway: null,
    status: 'Drag trees, animals, or factories onto the land. Watch gases come from each one.',
  }
}

export function plantCount(s: CarbonOxygenState) {
  return countAgents(s.agents, 'plant')
}
export function animalCount(s: CarbonOxygenState) {
  return countAgents(s.agents, 'animal')
}
export function factoryCount(s: CarbonOxygenState) {
  return countAgents(s.agents, 'factory')
}

export function effectiveSunlight(s: CarbonOxygenState): number {
  return s.isDay ? s.sunlightIntensity : 0
}

const OCEAN_BASELINE = 38

export function computeRates(s: CarbonOxygenState): ProcessRates {
  const sun = effectiveSunlight(s)
  const plants = plantCount(s)
  const animals = animalCount(s)
  const factories = factoryCount(s)
  const excess = Math.max(0, s.co2Level - OCEAN_BASELINE)
  return {
    photosynthesis: (sun / 100) * plants * 2.2,
    respiration: (plants * 0.18 + animals * 0.85) * 1.15,
    decomposition: s.deadMatterAmount * 0.18,
    combustion: factories * 4.5,
    oceanAbsorb: s.oceanStrength * 0.22 * (0.35 + excess / 40),
  }
}

export function netGasRates(rates: ProcessRates) {
  const netCo2 =
    rates.respiration + rates.decomposition + rates.combustion - rates.photosynthesis - rates.oceanAbsorb
  const netO2 = rates.photosynthesis - rates.respiration - rates.combustion * 0.7
  return { netCo2, netO2 }
}

export function balanceStatus(netCo2: number): BalanceStatus {
  if (netCo2 > 0.8) return 'CO₂ rising'
  if (netCo2 < -0.8) return 'O₂ rising'
  return 'Balanced'
}

export function dominantProcess(rates: ProcessRates): keyof ProcessRates | 'balanced' {
  const entries = Object.entries(rates) as [keyof ProcessRates, number][]
  entries.sort((a, b) => b[1] - a[1])
  const [top, topV] = entries[0]
  const second = entries[1][1]
  if (topV < 0.8 || topV < second * 1.15) return 'balanced'
  return top
}

function withCounts(s: CarbonOxygenState, agents: LandscapeAgent[]): CarbonOxygenState {
  const plants = countAgents(agents, 'plant')
  return {
    ...s,
    agents,
    deadMatterAmount: clamp(3 + plants * 0.7, 2, 16),
  }
}

export function addAgent(
  s: CarbonOxygenState,
  kind: AgentKind,
  nx: number,
  ny: number,
): CarbonOxygenState {
  if (countAgents(s.agents, kind) >= AGENT_LIMITS[kind]) {
    return {
      ...s,
      status: `Max ${AGENT_LIMITS[kind]} ${kind === 'plant' ? 'trees' : kind === 'animal' ? 'animals' : 'factories'} — drag one off to remove.`,
    }
  }
  const agent: LandscapeAgent = {
    id: nextId(kind),
    kind,
    nx: clamp(nx, 0.02, 0.98),
    ny: clamp(ny, 0.02, 0.98),
  }
  const next = withCounts(s, [...s.agents, agent])
  return {
    ...next,
    status:
      kind === 'plant'
        ? 'Tree planted — it makes O₂ in daylight.'
        : kind === 'animal'
          ? 'Animal added — it breathes out CO₂.'
          : 'Factory added — it burns fuel and releases CO₂.',
    takeaway: null,
  }
}

export function removeAgent(s: CarbonOxygenState, id: string): CarbonOxygenState {
  const next = withCounts(
    s,
    s.agents.filter((a) => a.id !== id),
  )
  return { ...next, status: 'Removed — watch how the gases change.', takeaway: null }
}

/** Move agent; pass clampToLand=false while dragging so off-land drop can remove. */
export function moveAgent(
  s: CarbonOxygenState,
  id: string,
  nx: number,
  ny: number,
  clampToLand = true,
): CarbonOxygenState {
  return {
    ...s,
    agents: s.agents.map((a) =>
      a.id === id
        ? {
            ...a,
            nx: clampToLand ? clamp(nx, 0.02, 0.98) : nx,
            ny: clampToLand ? clamp(ny, 0.02, 0.98) : ny,
          }
        : a,
    ),
  }
}

export function setAgentCounts(
  s: CarbonOxygenState,
  plants: number,
  animals: number,
  factories: number,
): CarbonOxygenState {
  return withCounts(s, buildAgents(plants, animals, factories))
}

export function setCycleStep(s: CarbonOxygenState, id: CycleStepId): CarbonOxygenState {
  if (id === 'free') {
    return {
      ...s,
      cycleStep: 'free',
      challenge: 'none',
      takeaway: null,
      status: 'Free play — drag trees, animals, and factories onto the land.',
    }
  }
  const step = CYCLE_STEPS.find((x) => x.id === id)
  if (!step) return s
  return {
    ...s,
    cycleStep: id,
    challenge: 'none',
    isDay: step.preset.isDay,
    autoDayNight: false,
    sunlightIntensity: step.preset.sunlight,
    oceanStrength: step.preset.ocean,
    agents: buildAgents(step.preset.plants, step.preset.animals, step.preset.factories),
    deadMatterAmount: clamp(3 + step.preset.plants * 0.7, 2, 16),
    takeaway: null,
    status: `${step.guideTitle}: ${step.guideBody}`,
  }
}

export function applyChallenge(s: CarbonOxygenState, kind: ChallengeKind): CarbonOxygenState {
  if (kind === 'deforestation') {
    return {
      ...setAgentCounts(s, 2, 2, 4),
      oceanStrength: 4,
      isDay: true,
      autoDayNight: false,
      sunlightIntensity: Math.max(s.sunlightIntensity, 70),
      cycleStep: 'free',
      challenge: kind,
      takeaway: 'Fewer trees + more factories → CO₂ rises. Drag trees back to recover.',
      status: 'Challenge: Deforestation — fix it by dragging agents.',
    }
  }
  if (kind === 'reforestation') {
    return {
      ...setAgentCounts(s, 8, 4, 1),
      oceanStrength: 8,
      isDay: true,
      autoDayNight: false,
      sunlightIntensity: Math.max(s.sunlightIntensity, 70),
      cycleStep: 'free',
      challenge: kind,
      takeaway: 'More trees + fewer smokestacks → O₂ rises. Experiment from here.',
      status: 'Challenge: Reforestation — explore this healthier world.',
    }
  }
  return { ...s, challenge: 'none', takeaway: null, status: 'Challenge cleared.' }
}

export function stepCarbonOxygen(s: CarbonOxygenState, dt: number): CarbonOxygenState {
  const h = dt * s.simSpeed
  let isDay = s.isDay
  if (s.autoDayNight) {
    const phase = ((s.time + h) / DAY_NIGHT_PERIOD) % 1
    isDay = phase < 0.5
  }
  const rates = computeRates({ ...s, isDay })
  const { netCo2, netO2 } = netGasRates(rates)
  const co2Level = clamp(s.co2Level + netCo2 * h, CO2_MIN, CO2_MAX)
  const o2Level = clamp(s.o2Level + netO2 * h, O2_MIN, O2_MAX)
  const history = [...s.history, { co2: co2Level, o2: o2Level }]
  if (history.length > HISTORY_MAX) history.shift()
  return {
    ...s,
    isDay,
    co2Level,
    o2Level,
    netCo2Rate: netCo2,
    netO2Rate: netO2,
    history,
    time: s.time + h,
  }
}

export function triadForState(s: CarbonOxygenState): [string, string, string] {
  const step = CYCLE_STEPS.find((x) => x.id === s.cycleStep)
  if (step && s.cycleStep !== 'free') return [step.now, step.why, step.next]
  const rates = computeRates(s)
  const d = dominantProcess(rates)
  if (d === 'photosynthesis') {
    return [
      'Your trees are making oxygen.',
      'Sunlight + plants turn CO₂ into food and release O₂.',
      'Drag animals in, or toggle Night, to reverse the gases.',
    ]
  }
  if (d === 'respiration') {
    return [
      'Your animals are breathing out CO₂.',
      'Living things use O₂ and return CO₂ to the air.',
      'Tap the soil or add trees so decay can return carbon.',
    ]
  }
  if (d === 'decomposition') {
    return [
      'Decay is returning carbon.',
      'Fungi and bacteria break down dead things → CO₂.',
      'Raise Ocean strength to pull CO₂ into seawater.',
    ]
  }
  if (d === 'oceanAbsorb') {
    return [
      'Oceans are taking in CO₂.',
      'CO₂ dissolves in ocean water — a natural sink.',
      'Drag factories in to overwhelm the sinks.',
    ]
  }
  if (d === 'combustion') {
    return [
      'Your factories are adding CO₂.',
      'Coal and oil release stored carbon as CO₂.',
      'Drag factories out or add more trees to restore balance.',
    ]
  }
  return [
    'The cycle is roughly balanced.',
    'Plants, breathing, decay, oceans, and burning roughly cancel out.',
    'Drag trees, animals, or factories to tip the balance.',
  ]
}
