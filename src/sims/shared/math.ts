/** Shared interpolation / easing — keep physics models unchanged; damp presentation only. */

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Ease-in-out cubic for 0..1 progress. */
export function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** Exponential approach toward target (frame-rate independent). Higher rate → snappier. */
export function approach(current: number, target: number, dt: number, rate: number): number {
  if (Math.abs(target - current) < 1e-4) return target
  return current + (target - current) * (1 - Math.exp(-rate * dt))
}

/**
 * Critically damped smooth follow. Mutates `velocity.v`.
 * `smoothTime` ≈ time to reach ~target (seconds).
 */
export function smoothDamp(
  current: number,
  target: number,
  velocity: { v: number },
  smoothTime: number,
  dt: number,
  maxSpeed = Infinity,
): number {
  const st = Math.max(0.0001, smoothTime)
  const omega = 2 / st
  const x = omega * dt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  let change = current - target
  const maxChange = maxSpeed * st
  change = clamp(change, -maxChange, maxChange)
  const temp = (velocity.v + omega * change) * dt
  velocity.v = (velocity.v - omega * temp) * exp
  let output = target + (change + temp) * exp
  if ((target - current > 0) === (output > target)) {
    output = target
    velocity.v = 0
  }
  return output
}
