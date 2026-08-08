/** Floating and sinking — density vs water (book p.104). */

export const WATER_DENSITY = 1.0 // g/cm³

export type BuoyancyState = 'floats' | 'sinks' | 'suspends'

export function buoyancyState(objectDensity: number, waterDensity = WATER_DENSITY): BuoyancyState {
  if (objectDensity < waterDensity - 1e-9) return 'floats'
  if (objectDensity > waterDensity + 1e-9) return 'sinks'
  return 'suspends'
}

/**
 * Fraction of object volume submerged (0–1).
 * Floats: V_disp / V = ρ_obj / ρ_water; sinks: fully submerged (1).
 */
export function displacedVolumeFraction(objectDensity: number, waterDensity = WATER_DENSITY): number {
  if (waterDensity <= 0) return 0
  if (objectDensity >= waterDensity) return 1
  return Math.max(0, Math.min(1, objectDensity / waterDensity))
}

export function buoyancyLabel(objectDensity: number, waterDensity = WATER_DENSITY): string {
  const state = buoyancyState(objectDensity, waterDensity)
  if (state === 'floats') return 'Floats — denser water pushes up'
  if (state === 'sinks') return 'Sinks — object denser than water'
  return 'Suspends — same density as water'
}
