/**
 * Pure model — Rainbow Formation (Dispersion).
 * No canvas, DOM, or React imports.
 */

export interface RainbowState {
  phase: number
  speed: number
}

export const DEFAULT_RAINBOW_STATE: RainbowState = {
  phase: 0,
  speed: 1,
}

export function defaultRainbowState(): RainbowState {
  return { ...DEFAULT_RAINBOW_STATE }
}

export function stepRainbow(state: RainbowState, dt: number): RainbowState {
  const next = state.phase + dt * state.speed * 0.35
  return { ...state, phase: next > 1 ? 1 : next }
}
