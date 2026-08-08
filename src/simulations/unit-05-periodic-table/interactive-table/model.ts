/** First 18 elements (H→Ar) for Interactive Periodic Table — book p.46. */

export type ElementState = 'gas' | 'liquid' | 'solid'

export interface ElementData {
  symbol: string
  Z: number
  name: string
  mass: number
  config: string
  state: ElementState
  group: number
  period: number
}

/** Approximate relative atomic masses; electron configs as taught at Grade 8. */
export const ELEMENTS: ElementData[] = [
  { symbol: 'H', Z: 1, name: 'Hydrogen', mass: 1.0, config: '1', state: 'gas', group: 1, period: 1 },
  { symbol: 'He', Z: 2, name: 'Helium', mass: 4.0, config: '2', state: 'gas', group: 18, period: 1 },
  { symbol: 'Li', Z: 3, name: 'Lithium', mass: 7.0, config: '2, 1', state: 'solid', group: 1, period: 2 },
  { symbol: 'Be', Z: 4, name: 'Beryllium', mass: 9.0, config: '2, 2', state: 'solid', group: 2, period: 2 },
  { symbol: 'B', Z: 5, name: 'Boron', mass: 11.0, config: '2, 3', state: 'solid', group: 13, period: 2 },
  { symbol: 'C', Z: 6, name: 'Carbon', mass: 12.0, config: '2, 4', state: 'solid', group: 14, period: 2 },
  { symbol: 'N', Z: 7, name: 'Nitrogen', mass: 14.0, config: '2, 5', state: 'gas', group: 15, period: 2 },
  { symbol: 'O', Z: 8, name: 'Oxygen', mass: 16.0, config: '2, 6', state: 'gas', group: 16, period: 2 },
  { symbol: 'F', Z: 9, name: 'Fluorine', mass: 19.0, config: '2, 7', state: 'gas', group: 17, period: 2 },
  { symbol: 'Ne', Z: 10, name: 'Neon', mass: 20.0, config: '2, 8', state: 'gas', group: 18, period: 2 },
  { symbol: 'Na', Z: 11, name: 'Sodium', mass: 23.0, config: '2, 8, 1', state: 'solid', group: 1, period: 3 },
  { symbol: 'Mg', Z: 12, name: 'Magnesium', mass: 24.0, config: '2, 8, 2', state: 'solid', group: 2, period: 3 },
  { symbol: 'Al', Z: 13, name: 'Aluminium', mass: 27.0, config: '2, 8, 3', state: 'solid', group: 13, period: 3 },
  { symbol: 'Si', Z: 14, name: 'Silicon', mass: 28.0, config: '2, 8, 4', state: 'solid', group: 14, period: 3 },
  { symbol: 'P', Z: 15, name: 'Phosphorus', mass: 31.0, config: '2, 8, 5', state: 'solid', group: 15, period: 3 },
  { symbol: 'S', Z: 16, name: 'Sulfur', mass: 32.0, config: '2, 8, 6', state: 'solid', group: 16, period: 3 },
  { symbol: 'Cl', Z: 17, name: 'Chlorine', mass: 35.5, config: '2, 8, 7', state: 'gas', group: 17, period: 3 },
  { symbol: 'Ar', Z: 18, name: 'Argon', mass: 40.0, config: '2, 8, 8', state: 'gas', group: 18, period: 3 },
]

export function elementByZ(Z: number): ElementData | undefined {
  return ELEMENTS.find((e) => e.Z === Z)
}

export function elementBySymbol(symbol: string): ElementData | undefined {
  return ELEMENTS.find((e) => e.symbol === symbol)
}

/** Grid cell key for period/group layout (period 1–3, groups 1–18). */
export function gridKey(period: number, group: number): string {
  return `${period}-${group}`
}
