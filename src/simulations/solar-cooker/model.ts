export interface SolarCookerState {
  reflectorAngle: number
  temperature: number
  sunElevation: number
  running: boolean
}

export const MIN_ANGLE = -35
export const MAX_ANGLE = 35
export const MAX_TEMP = 120

/** How well the reflector focuses sunlight onto the pot (0–1). */
export function alignmentFactor(reflectorAngle: number, sunElevation: number): number {
  const optimal = sunElevation * 0.55
  const diff = Math.abs(reflectorAngle - optimal)
  return Math.max(0, 1 - diff / 28)
}

export function focusIntensity(alignment: number): number {
  return alignment * alignment
}

export function stepSolarCooker(state: SolarCookerState, dt: number): SolarCookerState {
  if (!state.running) return state
  const alignment = alignmentFactor(state.reflectorAngle, state.sunElevation)
  const heatRate = focusIntensity(alignment) * 18
  const coolRate = 2.5
  const delta = heatRate - coolRate
  const next = state.temperature + delta * dt
  return {
    ...state,
    temperature: Math.max(20, Math.min(MAX_TEMP, next)),
  }
}

export function createInitialState(): SolarCookerState {
  return {
    reflectorAngle: 0,
    temperature: 22,
    sunElevation: 42,
    running: false,
  }
}

export function tempLabel(c: number): string {
  if (c < 35) return 'Cool'
  if (c < 55) return 'Warm'
  if (c < 80) return 'Hot'
  if (c < 100) return 'Cooking'
  return 'Boiling'
}
