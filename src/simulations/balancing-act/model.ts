/**
 * Balancing Act — constants & torque from PhET balancing-act Plank.ts
 * (PLANK_LENGTH 4.5 m, snap 0.25 m, plank mass 75 kg).
 */

export const PLANK_LENGTH = 4.5
export const PLANK_MASS = 75
export const SNAP = 0.25
export const MAX_TILT = 0.32 // rad ≈ PhET max before ground contact (approx)

/** Mystery mass set from PhET MysteryMass defaults (kg) */
export const MYSTERY_MASSES = [3, 5, 7.5, 10, 15, 20, 25, 50]

export interface BalanceState {
  leftMass: number
  leftDist: number
  rightMass: number
  rightDist: number
  /** Positive = left down (matches PhET: positive tilt left) */
  tilt: number
  angularVelocity: number
}

export function defaultBalanceState(): BalanceState {
  return {
    leftMass: 10,
    leftDist: 1.5,
    rightMass: 5,
    rightDist: 2,
    tilt: 0,
    angularVelocity: 0,
  }
}

export function snapDistance(d: number): number {
  const half = PLANK_LENGTH / 2 - SNAP
  const clamped = Math.max(SNAP, Math.min(half, d))
  return Math.round(clamped / SNAP) * SNAP
}

/** Torque about fulcrum: Σ (x_pivot − x_mass) m g  → left positive contribution when leftDist */
export function netTorque(state: BalanceState): number {
  // Convention: distance positive away from center; left mass produces +torque, right −torque
  return state.leftMass * state.leftDist - state.rightMass * state.rightDist
}

export function isBalanced(state: BalanceState, eps = 0.05): boolean {
  return Math.abs(netTorque(state)) < eps
}

/**
 * Simplified rotational dynamics on the plank (I ≈ M L²/12 for rod about center).
 * PhET uses full MOI including thickness; this captures the teeter-totter feel.
 */
export function stepBalance(state: BalanceState, dt: number): BalanceState {
  const I = (PLANK_MASS * PLANK_LENGTH * PLANK_LENGTH) / 12
  const g = 9.81
  const tau = netTorque(state) * g
  let { tilt, angularVelocity } = state
  angularVelocity += (tau / I) * dt
  angularVelocity *= 0.985 // light damping
  tilt += angularVelocity * dt
  if (tilt > MAX_TILT) {
    tilt = MAX_TILT
    angularVelocity = 0
  } else if (tilt < -MAX_TILT) {
    tilt = -MAX_TILT
    angularVelocity = 0
  }
  if (Math.abs(tau) < 0.05 && Math.abs(angularVelocity) < 0.02) {
    tilt *= 0.9
    angularVelocity = 0
  }
  return { ...state, tilt, angularVelocity }
}
