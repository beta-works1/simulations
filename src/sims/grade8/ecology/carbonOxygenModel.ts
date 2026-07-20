/** Model: carbon–oxygen cycle with photosynthesis, respiration, decomposition, combustion. */

export const HISTORY_MAX = 180
export const CO2_MIN = 5
export const CO2_MAX = 95
export const O2_MIN = 5
export const O2_MAX = 95

/** Day/night auto-cycle period in simulated seconds. */
export const DAY_NIGHT_PERIOD = 16

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

export type BalanceStatus = 'Balanced' | 'CO₂ rising' | 'O₂ rising'

export interface CarbonOxygenState {
  co2Level: number
  o2Level: number
  sunlightIntensity: number
  isDay: boolean
  /** When true, isDay flips automatically over DAY_NIGHT_PERIOD. */
  autoDayNight: boolean
  plantCount: number
  animalPopulation: number
  factoryVehicleCount: number
  deadMatterAmount: number
  simSpeed: number
  time: number
  history: GasSample[]
  /** Instantaneous net CO₂ change per simulated second (for trend arrow). */
  netCo2Rate: number
  netO2Rate: number
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
    autoDayNight: false,
    plantCount: 12,
    animalPopulation: 6,
    factoryVehicleCount: 2,
    deadMatterAmount: 8,
    simSpeed: 1,
    time: 0,
    history: [{ co2: 42, o2: 58 }],
    netCo2Rate: 0,
    netO2Rate: 0,
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
 * Tuned so factory/plant/sunlight slider moves create a clear chart slope in a few seconds.
 */
export function computeRates(s: CarbonOxygenState): ProcessRates {
  const sun = effectiveSunlight(s)
  const plants = s.plantCount
  const animals = s.animalPopulation
  const factories = s.factoryVehicleCount
  const dead = s.deadMatterAmount

  const photosynthesis = (sun / 100) * plants * 1.35
  const respiration = (plants * 0.22 + animals * 0.55) * 1.15
  const decomposition = dead * 0.18
  const combustion = factories * 2.1

  return { photosynthesis, respiration, decomposition, combustion }
}

export function netGasRates(rates: ProcessRates): { netCo2: number; netO2: number } {
  const netCo2 = rates.respiration + rates.decomposition + rates.combustion - rates.photosynthesis
  const netO2 = rates.photosynthesis - rates.respiration - rates.combustion * 0.7
  return { netCo2, netO2 }
}

export function balanceStatus(netCo2: number): BalanceStatus {
  if (netCo2 > 0.8) return 'CO₂ rising'
  if (netCo2 < -0.8) return 'O₂ rising'
  return 'Balanced'
}

export function stepCarbonOxygen(s: CarbonOxygenState, dt: number): CarbonOxygenState {
  let next = s
  if (s.scenarioProgress !== null) {
    next = advanceScenario(s, dt)
  }

  const h = dt * next.simSpeed
  let isDay = next.isDay
  if (next.autoDayNight) {
    // Half period day, half night
    const phase = ((next.time + h) / DAY_NIGHT_PERIOD) % 1
    isDay = phase < 0.5
  }

  const withDay = { ...next, isDay }
  const rates = computeRates(withDay)
  const { netCo2, netO2 } = netGasRates(rates)

  const co2Level = clamp(withDay.co2Level + netCo2 * h, CO2_MIN, CO2_MAX)
  const o2Level = clamp(withDay.o2Level + netO2 * h, O2_MIN, O2_MAX)

  const history = [...withDay.history, { co2: co2Level, o2: o2Level }]
  if (history.length > HISTORY_MAX) history.shift()

  const deadMatterAmount = clamp(4 + withDay.plantCount * 0.55, 2, 22)

  return {
    ...withDay,
    co2Level,
    o2Level,
    deadMatterAmount,
    history,
    netCo2Rate: netCo2,
    netO2Rate: netO2,
    time: withDay.time + h,
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
    autoDayNight: false,
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
    autoDayNight: false,
    sunlightIntensity: Math.max(s.sunlightIntensity, 75),
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1)
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
