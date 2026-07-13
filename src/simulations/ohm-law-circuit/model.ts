export interface OhmLawState {
  voltage: number
  resistance: number
  switchClosed: boolean
}

export const DEFAULT_OHM_LAW_STATE: OhmLawState = {
  voltage: 6,
  resistance: 6,
  switchClosed: true,
}

export function computeCurrent(state: OhmLawState): number {
  if (!state.switchClosed || state.resistance <= 0) return 0
  return state.voltage / state.resistance
}

/** Normalized bulb glow 0–1 from current (1 A ≈ full brightness). */
export function bulbBrightness(current: number): number {
  return Math.min(1, current)
}

export interface Point {
  x: number
  y: number
}

/** Rectangular closed-loop wire path (clockwise from top-left). */
export function circuitLoop(w: number, h: number): Point[] {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.38, 280)
  const hh = Math.min(h * 0.32, 160)
  return [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ]
}

export function pathLength(points: Point[]): number {
  let len = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    len += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return len
}

export function pointOnLoop(points: Point[], t: number): Point {
  const total = pathLength(points)
  let dist = ((t % 1) + 1) % 1 * total
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (dist <= seg) {
      const f = seg > 0 ? dist / seg : 0
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    dist -= seg
  }
  return points[0]
}

export interface Particle {
  t: number
}

const MAX_PARTICLES = 24

export function spawnParticles(current: number): Particle[] {
  const count = Math.min(MAX_PARTICLES, Math.round(current * 12))
  return Array.from({ length: count }, (_, i) => ({ t: i / Math.max(count, 1) }))
}

export function advanceParticles(particles: Particle[], current: number, dt: number): void {
  const speed = current * 0.35
  for (const p of particles) {
    p.t = (p.t + speed * dt) % 1
  }
}
