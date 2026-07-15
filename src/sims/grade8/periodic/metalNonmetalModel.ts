/** Metals vs non-metals comparison — PTB Ch 4. Model only; Canvas draws state. */

export const METALS = [
  { value: 'Na', label: 'Sodium (Na)', color: '#bdc3c7' },
  { value: 'Mg', label: 'Magnesium (Mg)', color: '#aeb6bf' },
  { value: 'Al', label: 'Aluminum (Al)', color: '#95a5a6' },
  { value: 'Fe', label: 'Iron (Fe)', color: '#7f8c8d' },
] as const

export const NONMETALS = [
  { value: 'C', label: 'Carbon (C)', color: '#2c3e50' },
  { value: 'N', label: 'Nitrogen (N)', color: '#3498db' },
  { value: 'O', label: 'Oxygen (O)', color: '#e74c3c' },
  { value: 'Cl', label: 'Chlorine (Cl)', color: '#27ae60' },
] as const

export interface MetalNonmetalState {
  time: number
}

export function createMetalNonmetalState(): MetalNonmetalState {
  return { time: 0 }
}

export function stepMetalNonmetal(s: MetalNonmetalState, dt: number): MetalNonmetalState {
  return { time: s.time + dt }
}

export function cycleValue<T extends { value: string }>(list: readonly T[], current: string): string {
  const idx = list.findIndex((m) => m.value === current)
  return list[(idx + 1) % list.length].value
}
