export type ElementCategory =
  | 'alkali'
  | 'alkaline'
  | 'noble'
  | 'halogen'
  | 'other-nonmetal'
  | 'metalloid'
  | 'other-metal'

export interface ElementInfo {
  z: number
  symbol: string
  name: string
  period: number
  group: number
  category: ElementCategory
  electronConfig: string
  shells: number[]
}

export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  alkali: '#e74c3c',
  alkaline: '#e67e22',
  noble: '#9b59b6',
  halogen: '#27ae60',
  'other-nonmetal': '#3498db',
  metalloid: '#16a085',
  'other-metal': '#7f8c8d',
}

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  alkali: 'Alkali metal',
  alkaline: 'Alkaline earth',
  noble: 'Noble gas',
  halogen: 'Halogen',
  'other-nonmetal': 'Non-metal',
  metalloid: 'Metalloid',
  'other-metal': 'Metal',
}

/** First 18 elements (H through Ar) with Bohr shell data. */
export const ELEMENTS: ElementInfo[] = [
  { z: 1, symbol: 'H', name: 'Hydrogen', period: 1, group: 1, category: 'other-nonmetal', electronConfig: '1', shells: [1] },
  { z: 2, symbol: 'He', name: 'Helium', period: 1, group: 18, category: 'noble', electronConfig: '2', shells: [2] },
  { z: 3, symbol: 'Li', name: 'Lithium', period: 2, group: 1, category: 'alkali', electronConfig: '2,1', shells: [2, 1] },
  { z: 4, symbol: 'Be', name: 'Beryllium', period: 2, group: 2, category: 'alkaline', electronConfig: '2,2', shells: [2, 2] },
  { z: 5, symbol: 'B', name: 'Boron', period: 2, group: 13, category: 'metalloid', electronConfig: '2,3', shells: [2, 3] },
  { z: 6, symbol: 'C', name: 'Carbon', period: 2, group: 14, category: 'other-nonmetal', electronConfig: '2,4', shells: [2, 4] },
  { z: 7, symbol: 'N', name: 'Nitrogen', period: 2, group: 15, category: 'other-nonmetal', electronConfig: '2,5', shells: [2, 5] },
  { z: 8, symbol: 'O', name: 'Oxygen', period: 2, group: 16, category: 'other-nonmetal', electronConfig: '2,6', shells: [2, 6] },
  { z: 9, symbol: 'F', name: 'Fluorine', period: 2, group: 17, category: 'halogen', electronConfig: '2,7', shells: [2, 7] },
  { z: 10, symbol: 'Ne', name: 'Neon', period: 2, group: 18, category: 'noble', electronConfig: '2,8', shells: [2, 8] },
  { z: 11, symbol: 'Na', name: 'Sodium', period: 3, group: 1, category: 'alkali', electronConfig: '2,8,1', shells: [2, 8, 1] },
  { z: 12, symbol: 'Mg', name: 'Magnesium', period: 3, group: 2, category: 'alkaline', electronConfig: '2,8,2', shells: [2, 8, 2] },
  { z: 13, symbol: 'Al', name: 'Aluminum', period: 3, group: 13, category: 'other-metal', electronConfig: '2,8,3', shells: [2, 8, 3] },
  { z: 14, symbol: 'Si', name: 'Silicon', period: 3, group: 14, category: 'metalloid', electronConfig: '2,8,4', shells: [2, 8, 4] },
  { z: 15, symbol: 'P', name: 'Phosphorus', period: 3, group: 15, category: 'other-nonmetal', electronConfig: '2,8,5', shells: [2, 8, 5] },
  { z: 16, symbol: 'S', name: 'Sulfur', period: 3, group: 16, category: 'other-nonmetal', electronConfig: '2,8,6', shells: [2, 8, 6] },
  { z: 17, symbol: 'Cl', name: 'Chlorine', period: 3, group: 17, category: 'halogen', electronConfig: '2,8,7', shells: [2, 8, 7] },
  { z: 18, symbol: 'Ar', name: 'Argon', period: 3, group: 18, category: 'noble', electronConfig: '2,8,8', shells: [2, 8, 8] },
]

export function getElementBySymbol(symbol: string): ElementInfo | undefined {
  return ELEMENTS.find((e) => e.symbol === symbol)
}

/** Map group (1–18) and period (1–3) to canvas grid cell for the short-form table. */
export function tableCell(period: number, group: number): { col: number; row: number } | null {
  if (period < 1 || period > 3) return null
  if (group >= 1 && group <= 2) return { col: group - 1, row: period - 1 }
  if (group >= 13 && group <= 18) return { col: group - 11, row: period - 1 }
  return null
}
