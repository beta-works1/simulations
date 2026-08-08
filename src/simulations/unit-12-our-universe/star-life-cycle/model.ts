/** Star life cycle by mass — Unit 12, p.151. */

export type StarStage =
  | 'Main sequence'
  | 'Red giant'
  | 'White dwarf (WD)'
  | 'Supernova'
  | 'Neutron star (NS)'
  | 'Black hole (BH)'

/** Solar masses in a classroom-friendly range. */
export function clampMass(solarMasses: number): number {
  return Math.max(0.5, Math.min(40, solarMasses))
}

/**
 * End-stage label from mass (classroom model).
 * Low/medium (< ~8 M☉) → WD; high mass → NS (8–25) or BH (> 25).
 */
export function stageForMass(solarMasses: number, late = true): StarStage {
  const m = clampMass(solarMasses)
  if (!late) return 'Main sequence'
  if (m < 8) return 'White dwarf (WD)'
  if (m <= 25) return 'Neutron star (NS)'
  return 'Black hole (BH)'
}

/** Path labels for UI: WD vs NS vs BH for high-mass remnant. */
export function remnantForMass(solarMasses: number): 'WD' | 'NS' | 'BH' {
  const m = clampMass(solarMasses)
  if (m < 8) return 'WD'
  if (m <= 25) return 'NS'
  return 'BH'
}

export function lifePathSummary(solarMasses: number): string {
  const rem = remnantForMass(solarMasses)
  if (rem === 'WD') {
    return 'Main sequence → Red giant → White dwarf (WD)'
  }
  if (rem === 'NS') {
    return 'Main sequence → Red giant → Supernova → Neutron star (NS)'
  }
  return 'Main sequence → Red giant → Supernova → Black hole (BH)'
}
