/** Ecological pyramid / 10% energy rule. Model only; Canvas draws state. */

export const PYRAMID_LABELS = ['Producers', 'Primary consumers', 'Secondary', 'Tertiary'] as const

export const PYRAMID_COLORS = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b'] as const

export interface PyramidState {
  baseEnergy: number
  pulse: number
}

export function createPyramidState(): PyramidState {
  return { baseEnergy: 10000, pulse: 0 }
}

export function stepPyramid(s: PyramidState, dt: number, running: boolean): PyramidState {
  if (!running || dt <= 0) return s
  return { ...s, pulse: s.pulse + dt }
}

/** Energy at each trophic level (10% rule). */
export function tierEnergies(base: number): number[] {
  return [base, base * 0.1, base * 0.01, base * 0.001]
}

export function formatEnergy(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
}
