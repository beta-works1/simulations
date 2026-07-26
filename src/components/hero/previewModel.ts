/**
 * Toy model behind the hero preview — deliberately simplified, not the physics
 * used by the real Greenhouse Effect sim. Kept separate from the views so the
 * 2D fallback and the 3D scene stay in sync off one source of truth.
 */

/** Model baseline before extra greenhouse gas is added, in °C. */
export const BASELINE_TEMP = 14.6

export interface PreviewState {
  /** Fraction of outgoing heat sent back down by the gas blanket, 0-1. */
  trapped: number
  /** Fraction of outgoing heat that reaches space, 0-1. */
  escaping: number
  temp: number
  delta: number
}

export function previewState(co2: number): PreviewState {
  const gas = Math.min(1, Math.max(0, co2))
  const trapped = 0.26 + gas * 0.46
  return {
    trapped,
    escaping: 1 - trapped,
    temp: BASELINE_TEMP + gas * 4.6,
    delta: gas * 4.6,
  }
}

/** Plain-language caption that tracks the slider, mirroring the sim's NOW line. */
export function previewCaption(co2: number): string {
  if (co2 < 0.2) return 'Thin gas blanket — most heat escapes to space.'
  if (co2 < 0.45) return 'More gas: some heat is bounced back to the surface.'
  if (co2 < 0.75) return 'Thicker blanket, less heat escaping, surface warming up.'
  return 'Thick blanket — heat is trapped and the surface keeps warming.'
}

export const GAS_TINT = '#7dd3fc'
export const HEAT_TINT = '#ef4444'
