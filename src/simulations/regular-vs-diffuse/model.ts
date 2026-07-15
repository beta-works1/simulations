/**
 * Pure model — Regular vs Diffuse Reflection.
 * No canvas, DOM, or React imports.
 */

export type SurfaceType = 'regular' | 'diffuse'

export interface RegularVsDiffuseState {
  surface: SurfaceType
  rayCount: number
}

export const DEFAULT_REGULAR_STATE: RegularVsDiffuseState = {
  surface: 'regular',
  rayCount: 7,
}

export function defaultRegularState(): RegularVsDiffuseState {
  return { ...DEFAULT_REGULAR_STATE }
}
