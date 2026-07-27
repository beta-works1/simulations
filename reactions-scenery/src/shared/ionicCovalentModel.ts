export type BondMode = 'ionic' | 'covalent-h2' | 'covalent-h2o'

export interface BondAnimState {
  phase: number
  time: number
}

export function createBondAnimState(): BondAnimState {
  return { phase: 0, time: 0 }
}

export function stepBondAnim(s: BondAnimState, dt: number, running: boolean): BondAnimState {
  if (!running) return s
  let phase = s.phase + dt * 0.35
  if (phase > 1) phase = 0
  return { phase, time: s.time + dt }
}

export function resetBondAnim(): BondAnimState {
  return createBondAnimState()
}

/** Ionic: electron moves from Na to Cl (0→1). Covalent: shared pair oscillates. */
export function ionicElectronPos(phase: number): { na: number; cl: number; transferred: boolean } {
  const t = Math.min(1, Math.max(0, phase))
  const transferred = t > 0.85
  const eOnCl = t
  return { na: 1 - eOnCl, cl: eOnCl, transferred }
}

export function covalentShareOffset(phase: number, time: number): number {
  return Math.sin(time * 3 + phase * Math.PI * 2) * 8
}
