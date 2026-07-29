/** Wind turbine physics (from React model). */

export const MIN_WIND = 0
export const MAX_WIND = 25

export function bladeRpm(windSpeed: number): number {
  if (windSpeed < 3) return 0
  return Math.min(60, ((windSpeed - 3) / 22) ** 1.4 * 60)
}

export function powerOutputKw(windSpeed: number): number {
  if (windSpeed < 3) return 0
  const factor = ((windSpeed - 3) / 22) ** 3
  return Math.min(2500, factor * 2500)
}

export function mechanicalPowerKw(windSpeed: number): number {
  return powerOutputKw(windSpeed) * 1.08
}

export function formatPower(kw: number): string {
  if (kw >= 1000) return `${(kw / 1000).toFixed(2)} MW`
  return `${kw.toFixed(0)} kW`
}

export function stepBladeAngle(bladeAngle: number, windSpeed: number, running: boolean, dt: number): number {
  if (!running || dt <= 0) return bladeAngle
  const rpm = bladeRpm(windSpeed)
  return (bladeAngle + rpm * 6 * dt) % 360
}
