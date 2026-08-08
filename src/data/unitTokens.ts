/**
 * Data-driven unit accent tokens (master plan §C).
 * One config object — components consume tokens, never hardcode unit colors.
 */
export type UnitId =
  | 'unit-01'
  | 'unit-02'
  | 'unit-03'
  | 'unit-04'
  | 'unit-05'
  | 'unit-06'
  | 'unit-07'
  | 'unit-08'
  | 'unit-09'
  | 'unit-10'
  | 'unit-11'
  | 'unit-12'

export interface UnitToken {
  id: UnitId
  name: string
  /** Primary accent for header / library card */
  accent: string
  /** Darker ink for text on light backgrounds */
  accentInk: string
  /** Soft wash for card backgrounds */
  accentSoft: string
}

export const UNIT_TOKENS: Record<UnitId, UnitToken> = {
  'unit-01': {
    id: 'unit-01',
    name: 'Ecology',
    accent: '#15803d',
    accentInk: '#14532d',
    accentSoft: '#dcfce7',
  },
  'unit-02': {
    id: 'unit-02',
    name: 'Human Nervous System',
    accent: '#c026d3',
    accentInk: '#86198f',
    accentSoft: '#fae8ff',
  },
  'unit-03': {
    id: 'unit-03',
    name: 'Variation, Heredity & Cell Division',
    accent: '#0891b2',
    accentInk: '#155e75',
    accentSoft: '#cffafe',
  },
  'unit-04': {
    id: 'unit-04',
    name: 'Biotechnology',
    accent: '#059669',
    accentInk: '#065f46',
    accentSoft: '#d1fae5',
  },
  'unit-05': {
    id: 'unit-05',
    name: 'Periodic Table',
    accent: '#0d9488',
    accentInk: '#115e59',
    accentSoft: '#ccfbf1',
  },
  'unit-06': {
    id: 'unit-06',
    name: 'Chemical Reactions',
    accent: '#f43f5e',
    accentInk: '#9f1239',
    accentSoft: '#ffe4e6',
  },
  'unit-07': {
    id: 'unit-07',
    name: 'Acids, Bases & Salts',
    accent: '#ea580c',
    accentInk: '#9a3412',
    accentSoft: '#ffedd5',
  },
  'unit-08': {
    id: 'unit-08',
    name: 'Force and Pressure',
    accent: '#2563eb',
    accentInk: '#1e3a8a',
    accentSoft: '#dbeafe',
  },
  'unit-09': {
    id: 'unit-09',
    name: 'Reflection & Refraction of Light',
    accent: '#d97706',
    accentInk: '#92400e',
    accentSoft: '#fef3c7',
  },
  'unit-10': {
    id: 'unit-10',
    name: 'Electricity and Magnetism',
    accent: '#4f46e5',
    accentInk: '#312e81',
    accentSoft: '#e0e7ff',
  },
  'unit-11': {
    id: 'unit-11',
    name: 'Technology in Everyday Life',
    accent: '#64748b',
    accentInk: '#334155',
    accentSoft: '#f1f5f9',
  },
  'unit-12': {
    id: 'unit-12',
    name: 'Our Universe',
    accent: '#1e3a8a',
    accentInk: '#172554',
    accentSoft: '#e0e7ff',
  },
}

export const PLATFORM_TOKENS = {
  canvasBg: '#f7f4ef',
  ink: '#152033',
  muted: '#5a6b7f',
  panel: '#ffffff',
  panelElevated: '#fbfaf8',
  bottomBar: '#1a2332',
  bottomBarText: '#e8eef8',
  focusRing: '#0ea5e9',
  success: '#15803d',
  danger: '#b91c1c',
} as const

export function unitCssVars(unitId: UnitId): Record<string, string> {
  const u = UNIT_TOKENS[unitId]
  return {
    '--gs8-accent': u.accent,
    '--gs8-accent-ink': u.accentInk,
    '--gs8-accent-soft': u.accentSoft,
  }
}
