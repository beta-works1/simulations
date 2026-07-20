/** Model: carbon–oxygen cycle with photosynthesis, respiration, decomposition, combustion. */

export const HISTORY_MAX = 180
export const CO2_MIN = 5
export const CO2_MAX = 95
export const O2_MIN = 5
export const O2_MAX = 95

export interface GasSample {
  co2: number
  o2: number
}

export interface ProcessRates {
  photosynthesis: number
  respiration: number
  decomposition: number
  combustion: number
}

export interface CarbonOxygenState {
  co2Level: number
  o2Level: number
  sunlightIntensity: number
  isDay: boolean
  plantCount: number
  animalPopulation: number
  factoryVehicleCount: number
  deadMatterAmount: number
  simSpeed: number
  time: number
  history: GasSample[]
  /** Deforestation + industry scenario progress 0→1; null when idle. */
  scenarioProgress: number | null
  scenarioFrom: { plantCount: number; factoryVehicleCount: number; animalPopulation: number } | null
  takeaway: string | null
}

export function createCarbonOxygenState(): CarbonOxygenState {
  return {
    co2Level: 42,
    o2Level: 58,
    sunlightIntensity: 80,
    isDay: true,
    plantCount: 12,
    animalPopulation: 6,
    factoryVehicleCount: 2,
    deadMatterAmount: 8,
    simSpeed: 1,
    time: 0,
    history: [{ co2: 42, o2: 58 }],
    scenarioProgress: null,
    scenarioFrom: null,
    takeaway: null,
  }
}

/** Effective sunlight for photosynthesis (zero at night). */
export function effectiveSunlight(s: CarbonOxygenState): number {
  return s.isDay ? s.sunlightIntensity : 0
}

/**
 * Process rates (gas units per second on the illustrative 0–100 scale).
 * Directions match Grade 8 definitions:
 * - Photosynthesis: consumes CO₂, produces O₂
 * - Respiration: consumes O₂, produces CO₂
 * - Decomposition: releases CO₂
 * - Combustion: consumes O₂, releases CO₂
 */
export function computeRates(s: CarbonOxygenState): ProcessRates {
  const sun = effectiveSunlight(s)
  const plants = s.plantCount
  const animals = s.animalPopulation
  const factories = s.factoryVehicleCount
  const dead = s.deadMatterAmount

  // Tuned so defaults sit near balance; night / deforestation / industry produce a clear slope.
  const photosynthesis = (sun / 100) * plants * 0.48
  const respiration = (plants * 0.14 + animals * 0.38) * 0.9
  const decomposition = dead * 0.09
  const combustion = factories * 0.55

  return { photosynthesis, respiration, decomposition, combustion }
}

export function stepCarbonOxygen(s: CarbonOxygenState, dt: number): CarbonOxygenState {
  let next = s
  if (s.scenarioProgress !== null) {
    next = advanceScenario(s, dt)
  }

  const rates = computeRates(next)
  const h = dt * next.simSpeed

  const co2Delta =
    rates.respiration + rates.decomposition + rates.combustion - rates.photosynthesis
  const o2Delta = rates.photosynthesis - rates.respiration - rates.combustion * 0.65

  // Independent clamps — no soft renormalization (that flattened the chart).
  const co2Level = clamp(next.co2Level + co2Delta * h, CO2_MIN, CO2_MAX)
  const o2Level = clamp(next.o2Level + o2Delta * h, O2_MIN, O2_MAX)

  const history = [...next.history, { co2: co2Level, o2: o2Level }]
  if (history.length > HISTORY_MAX) history.shift()

  const deadMatterAmount = clamp(4 + next.plantCount * 0.55, 2, 22)

  return {
    ...next,
    co2Level,
    o2Level,
    deadMatterAmount,
    history,
    time: next.time + h,
  }
}

/** Highlight photosynthesis when daylight production is meaningful; otherwise respiration. */
export function activeEquation(s: CarbonOxygenState): 'photosynthesis' | 'respiration' {
  const rates = computeRates(s)
  if (rates.photosynthesis > rates.respiration * 0.35 && effectiveSunlight(s) > 5) {
    return 'photosynthesis'
  }
  return 'respiration'
}

const SCENARIO_DURATION = 6

function advanceScenario(s: CarbonOxygenState, dt: number): CarbonOxygenState {
  const progress = Math.min(1, (s.scenarioProgress ?? 0) + (dt * s.simSpeed) / SCENARIO_DURATION)
  const from = s.scenarioFrom ?? {
    plantCount: s.plantCount,
    factoryVehicleCount: s.factoryVehicleCount,
    animalPopulation: s.animalPopulation,
  }
  const t = progress
  const done = progress >= 1
  return {
    ...s,
    plantCount: lerp(from.plantCount, 2, t),
    factoryVehicleCount: lerp(from.factoryVehicleCount, 18, t),
    animalPopulation: lerp(from.animalPopulation, 3, t),
    scenarioProgress: done ? null : progress,
    scenarioFrom: done ? null : from,
    takeaway:
      progress >= 0.25
        ? 'Cutting forests and burning fuels raise CO₂ and lower O₂ — the cycle falls out of balance.'
        : s.takeaway,
    isDay: true,
    sunlightIntensity: Math.max(s.sunlightIntensity, 70),
  }
}

export function startDeforestationScenario(s: CarbonOxygenState): CarbonOxygenState {
  return {
    ...s,
    scenarioProgress: 0,
    scenarioFrom: {
      plantCount: s.plantCount,
      factoryVehicleCount: s.factoryVehicleCount,
      animalPopulation: s.animalPopulation,
    },
    takeaway: null,
    isDay: true,
    sunlightIntensity: Math.max(s.sunlightIntensity, 75),
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1)
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
