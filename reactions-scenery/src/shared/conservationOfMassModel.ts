export interface MassConservationState {
  progress: number
  time: number
}

export const TOTAL_MASS = 25.0
export const ESCAPED_MASS = 4.2

export function createMassConservationState(): MassConservationState {
  return { progress: 0, time: 0 }
}

export function stepMassConservation(
  s: MassConservationState,
  dt: number,
  running: boolean,
): MassConservationState {
  if (!running) return s
  let progress = s.progress + dt * 0.18
  if (progress > 1) progress = 1
  return { progress, time: s.time + dt }
}

export function displayedMass(progress: number, sealed: boolean): number {
  if (sealed) return TOTAL_MASS
  return TOTAL_MASS - progress * ESCAPED_MASS
}

export function resetMassConservation(): MassConservationState {
  return createMassConservationState()
}
