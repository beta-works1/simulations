/** Shared Ohm's Law physics (from React PhET-adapted model). */

export const PHET_VOLTAGE = { min: 0.1, max: 9, default: 4.5 } as const
export const PHET_RESISTANCE = { min: 10, max: 1000, default: 500 } as const
export const AA_VOLTAGE = 1.5

export function computeCurrentMilliamps(voltage: number, resistance: number): number {
  if (resistance <= 0) return 0
  return (1000 * voltage) / resistance
}

export function getMaxCurrentMilliamps(): number {
  return computeCurrentMilliamps(PHET_VOLTAGE.max, PHET_RESISTANCE.min)
}

export function batteryCount(voltage: number): number {
  return Math.max(1, Math.ceil(voltage / AA_VOLTAGE - 1e-9))
}

export function bulbBrightness(milliamps: number): number {
  return Math.min(1, milliamps / getMaxCurrentMilliamps())
}

export function formulaLetterScale(kind: 'I' | 'V' | 'R', voltage: number, resistance: number, milliamps: number): number {
  const minI = computeCurrentMilliamps(PHET_VOLTAGE.min, PHET_RESISTANCE.max)
  const maxI = getMaxCurrentMilliamps()
  const nI = (milliamps - minI) / (maxI - minI)
  const nV = (voltage - PHET_VOLTAGE.min) / (PHET_VOLTAGE.max - PHET_VOLTAGE.min)
  const nR = (resistance - PHET_RESISTANCE.min) / (PHET_RESISTANCE.max - PHET_RESISTANCE.min)
  if (kind === 'I') return 1 + 4.5 * nI
  if (kind === 'V') return 1 + 1.6 * nV
  return 1 + 1.6 * nR
}

export function ohmLoop(w: number, h: number): { x: number; y: number }[] {
  const cx = w * 0.5
  const cy = h * 0.58
  const hw = Math.min(w * 0.38, 280)
  const hh = Math.min(h * 0.28, 140)
  return [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ]
}
