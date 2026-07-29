/** Solar cooker physics (from React model). */

export const MIN_ANGLE = -35
export const MAX_ANGLE = 35
export const MAX_TEMP = 120

export function alignmentFactor(reflectorAngle: number, sunElevation: number): number {
  const optimal = sunElevation * 0.55
  const diff = Math.abs(reflectorAngle - optimal)
  return Math.max(0, 1 - diff / 28)
}

export function focusIntensity(alignment: number): number {
  return alignment * alignment
}

export function tempLabel(c: number): string {
  if (c < 35) return 'Cool'
  if (c < 55) return 'Warm'
  if (c < 80) return 'Hot'
  if (c < 100) return 'Cooking'
  return 'Boiling'
}

export function stepTemperature(
  temperature: number,
  reflectorAngle: number,
  sunElevation: number,
  running: boolean,
  dt: number,
): number {
  if (!running || dt <= 0) return temperature
  const alignment = alignmentFactor(reflectorAngle, sunElevation)
  const heatRate = focusIntensity(alignment) * 18
  const coolRate = 2.5
  const next = temperature + (heatRate - coolRate) * dt
  return Math.max(20, Math.min(MAX_TEMP, next))
}
