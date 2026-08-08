/** STEAM project checklist — Unit 11, p.137. */

export type BuildId =
  | 'bioplastic'
  | 'soap'
  | 'solar-cooker'
  | 'wind-turbine'
  | 'ups'

export interface SteamBuild {
  id: BuildId
  label: string
  hint: string
}

export const STEAM_BUILDS: SteamBuild[] = [
  { id: 'bioplastic', label: 'Bioplastic', hint: 'Starch-based plastic from kitchen materials.' },
  { id: 'soap', label: 'Soap', hint: 'Saponification of oil with alkali.' },
  { id: 'solar-cooker', label: 'Solar cooker', hint: 'Reflect sunlight to heat food safely.' },
  { id: 'wind-turbine', label: 'Wind turbine', hint: 'Blades turn a generator for electricity.' },
  { id: 'ups', label: 'UPS model', hint: 'Backup power idea for short outages.' },
]

export function progress(checked: Record<BuildId, boolean>): {
  done: number
  total: number
  percent: number
  complete: boolean
} {
  const total = STEAM_BUILDS.length
  const done = STEAM_BUILDS.filter((b) => checked[b.id]).length
  return {
    done,
    total,
    percent: Math.round((100 * done) / total),
    complete: done === total,
  }
}

export function emptyChecklist(): Record<BuildId, boolean> {
  return {
    bioplastic: false,
    soap: false,
    'solar-cooker': false,
    'wind-turbine': false,
    ups: false,
  }
}
