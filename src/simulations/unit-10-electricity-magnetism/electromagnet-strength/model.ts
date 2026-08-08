/** Electromagnet strength via paperclip lift — Activity 10.5, p.132. */

export interface ElectromagnetState {
  turns: number
  current: number
  paperclips: number
}

/**
 * Strength proxy: paperclips = floor(turns × current × 0.4).
 * Turns 1–50, current 0–5 A.
 */
export function electromagnetStrength(turns: number, current: number): ElectromagnetState {
  const t = Math.max(1, Math.min(50, Math.round(turns)))
  const I = Math.max(0, Math.min(5, current))
  return {
    turns: t,
    current: I,
    paperclips: Math.floor(t * I * 0.4),
  }
}
