/** Floating & sinking — PTB Ch 3. Model only; Canvas draws state. */

export interface FloatState {
  y: number
  velocity: number
  time: number
}

export function createFloatState(): FloatState {
  return { y: 0.5, velocity: 0, time: 0 }
}

export type FloatVerdict = 'float' | 'suspend' | 'sink'

export function floatVerdict(objectDensity: number, fluidDensity: number): FloatVerdict {
  const diff = objectDensity - fluidDensity
  if (Math.abs(diff) < 0.05) return 'suspend'
  return diff < 0 ? 'float' : 'sink'
}

/** Simple density model — unchanged. */
export function stepFloat(
  s: FloatState,
  dt: number,
  objectDensity: number,
  fluidDensity: number,
): FloatState {
  const verdict = floatVerdict(objectDensity, fluidDensity)
  const targetY = verdict === 'float' ? 0.22 : verdict === 'sink' ? 0.88 : 0.55
  const buoyancy = (fluidDensity - objectDensity) * 0.08
  let { y, velocity } = s
  velocity += buoyancy * dt
  velocity += (targetY - y) * 2.2 * dt
  velocity *= 0.94
  y += velocity * dt
  y = Math.max(0.15, Math.min(0.92, y))
  return { ...s, y, velocity, time: s.time + dt }
}
