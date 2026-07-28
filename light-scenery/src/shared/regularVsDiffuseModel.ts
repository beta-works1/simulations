/**
 * Pure model — Regular vs Diffuse Reflection.
 * No canvas, DOM, or React imports.
 */

export type SurfaceType = 'regular' | 'diffuse'

export interface RegularVsDiffuseState {
  surface: SurfaceType
  rayCount: number
  /** Incident angle from the surface normal, degrees (−50…50). */
  incidenceDeg: number
}

export const MIN_INCIDENCE = -50
export const MAX_INCIDENCE = 50

export const DEFAULT_REGULAR_STATE: RegularVsDiffuseState = {
  surface: 'regular',
  rayCount: 7,
  incidenceDeg: 0,
}

export function defaultRegularState(): RegularVsDiffuseState {
  return { ...DEFAULT_REGULAR_STATE }
}

export function clampIncidence(deg: number): number {
  return Math.max(MIN_INCIDENCE, Math.min(MAX_INCIDENCE, deg))
}
