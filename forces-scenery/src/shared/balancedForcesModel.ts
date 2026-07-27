/** Balanced & unbalanced forces — PTB Ch 3. Model only; Canvas draws state. */

export interface BalancedForcesState {
  position: number
  velocity: number
  time: number
}

export function createBalancedForcesState(): BalancedForcesState {
  return { position: 0, velocity: 0, time: 0 }
}

/** F_net = F_right − F_left; a = F_net / mass — unchanged core model. */
export function stepBalancedForces(
  s: BalancedForcesState,
  dt: number,
  fLeft: number,
  fRight: number,
  mass: number,
): BalancedForcesState {
  const fNet = fRight - fLeft
  const accel = fNet / mass
  let { velocity, position } = s
  velocity += accel * dt
  velocity *= 0.992
  position += velocity * dt * 28
  position = Math.max(-1, Math.min(1, position))
  return { ...s, position, velocity, time: s.time + dt }
}
