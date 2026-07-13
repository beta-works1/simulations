export interface WindTurbineState {
  windSpeed: number
  bladeAngle: number
  running: boolean
}

export const MIN_WIND = 0
export const MAX_WIND = 25

/** Blade RPM from wind speed (simplified cubic relationship). */
export function bladeRpm(windSpeed: number): number {
  if (windSpeed < 3) return 0
  return Math.min(60, ((windSpeed - 3) / 22) ** 1.4 * 60)
}

/** Electrical power output in kW. */
export function powerOutputKw(windSpeed: number): number {
  if (windSpeed < 3) return 0
  const factor = ((windSpeed - 3) / 22) ** 3
  return Math.min(2500, factor * 2500)
}

/** Mechanical shaft power (slightly higher than electrical). */
export function mechanicalPowerKw(windSpeed: number): number {
  return powerOutputKw(windSpeed) * 1.08
}

export function stepWindTurbine(state: WindTurbineState, dt: number): WindTurbineState {
  if (!state.running) return state
  const rpm = bladeRpm(state.windSpeed)
  const degPerSec = rpm * 6
  return {
    ...state,
    bladeAngle: (state.bladeAngle + degPerSec * dt) % 360,
  }
}

export function createInitialState(): WindTurbineState {
  return { windSpeed: 8, bladeAngle: 0, running: true }
}

export function formatPower(kw: number): string {
  if (kw >= 1000) return `${(kw / 1000).toFixed(2)} MW`
  return `${kw.toFixed(0)} kW`
}
