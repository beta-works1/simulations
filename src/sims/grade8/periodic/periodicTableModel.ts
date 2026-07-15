/** Bohr-model orbit animation for periodic table explorer. Model only; Canvas draws. */

export interface BohrAnimState {
  time: number
}

export function createBohrAnimState(): BohrAnimState {
  return { time: 0 }
}

export function stepBohrAnim(s: BohrAnimState, dt: number): BohrAnimState {
  return { time: s.time + dt }
}
