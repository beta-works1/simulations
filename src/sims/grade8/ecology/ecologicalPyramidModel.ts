/** Ecological pyramid / 10% energy rule. Model only; Canvas draws state. */

export const PYRAMID_LABELS = ['Producers', 'Primary consumers', 'Secondary', 'Tertiary'] as const

export const PYRAMID_COLORS = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b'] as const

export const DECOMPOSER_LABEL = 'Decomposers'

export type PyramidMode = 'energy' | 'biomass' | 'numbers'

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

/** Typical organism counts at each level (relative pyramid). */
export function tierOrganismCounts(base: number): number[] {
  const scale = base / 10000
  return [
    Math.round(10000 * scale),
    Math.round(1000 * scale),
    Math.round(100 * scale),
    Math.round(10 * scale),
  ]
}

/** Biomass pyramid (kg) — same 10% shape, different units. */
export function tierBiomass(base: number): number[] {
  const scale = base / 10000
  return [9000 * scale, 900 * scale, 90 * scale, 9 * scale]
}

export function tierValues(base: number, mode: PyramidMode): number[] {
  if (mode === 'biomass') return tierBiomass(base)
  if (mode === 'numbers') return tierOrganismCounts(base)
  return tierEnergies(base)
}

export function formatEnergy(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
}

export function formatTierValue(n: number, mode: PyramidMode): string {
  if (mode === 'numbers') return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
  if (mode === 'biomass') return n >= 1000 ? `${(n / 1000).toFixed(1)}k kg` : `${Math.round(n)} kg`
  return formatEnergy(n)
}

export function modeUnit(mode: PyramidMode): string {
  if (mode === 'numbers') return 'organisms'
  if (mode === 'biomass') return 'biomass'
  return 'energy'
}

export interface TierDetail {
  label: string
  energy: number
  pctOfBase: number
  pctFromBelow: number
  lostFromBelow: number
  organisms: number
  biomass: number
}

/** Stats for a pyramid tier (10% rule). */
export function tierDetail(base: number, tier: number, mode: PyramidMode = 'energy'): TierDetail {
  const energies = tierEnergies(base)
  const counts = tierOrganismCounts(base)
  const biomass = tierBiomass(base)
  const energy = energies[tier] ?? 0
  const below = tier > 0 ? energies[tier - 1]! : base
  const pctOfBase = base > 0 ? (energy / base) * 100 : 0
  const pctFromBelow = below > 0 ? (energy / below) * 100 : 0
  const values = tierValues(base, mode)
  return {
    label: PYRAMID_LABELS[tier] ?? '',
    energy: values[tier] ?? 0,
    pctOfBase,
    pctFromBelow,
    lostFromBelow: Math.max(0, 100 - pctFromBelow),
    organisms: counts[tier] ?? 0,
    biomass: biomass[tier] ?? 0,
  }
}

/** Dots to draw inside a tier band (capped for performance). */
export function tierDotCount(base: number, tier: number, mode: PyramidMode): number {
  const n = tierValues(base, mode)[tier] ?? 0
  if (mode === 'numbers') return Math.min(48, Math.max(4, Math.round(Math.sqrt(n))))
  if (mode === 'biomass') return Math.min(40, Math.max(4, Math.round(n / 250)))
  return Math.min(36, Math.max(4, Math.round(Math.log10(n + 1) * 8)))
}
