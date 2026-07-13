export interface ShortCircuitState {
  voltage: number
  loadResistance: number
  fuseRating: number
  shorted: boolean
  fuseBlown: boolean
}

export const DEFAULT_SHORT_CIRCUIT_STATE: ShortCircuitState = {
  voltage: 12,
  loadResistance: 24,
  fuseRating: 2,
  shorted: false,
  fuseBlown: false,
}

const SHORT_RESISTANCE = 0.05
const WIRE_RESISTANCE = 0.1

export interface FuseReadout {
  current: number
  fuseIntact: boolean
  loadPowered: boolean
}

export function computeCircuit(state: ShortCircuitState): FuseReadout {
  if (state.fuseBlown) {
    return { current: 0, fuseIntact: false, loadPowered: false }
  }

  let resistance: number
  if (state.shorted) {
    resistance = SHORT_RESISTANCE + WIRE_RESISTANCE
  } else {
    resistance = state.loadResistance + WIRE_RESISTANCE
  }

  const current = state.voltage / resistance
  const fuseIntact = current <= state.fuseRating
  const loadPowered = !state.shorted && fuseIntact

  return { current, fuseIntact, loadPowered }
}

export function resetFuse(state: ShortCircuitState): ShortCircuitState {
  return { ...state, fuseBlown: false, shorted: false }
}

export interface Point {
  x: number
  y: number
}

export function mainLoop(w: number, h: number): Point[] {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.38, 270)
  const hh = Math.min(h * 0.3, 150)
  return [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ]
}

export function shortBypass(w: number, h: number): Point[] {
  const loop = mainLoop(w, h)
  const left = loop[3]
  const right = loop[2]
  const y = (left.y + right.y) * 0.5 + 28
  return [
    { x: left.x + 60, y: left.y + 40 },
    { x: left.x + 60, y },
    { x: right.x - 60, y },
    { x: right.x - 60, y: right.y - 40 },
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

export function pointOnPath(points: Point[], t: number, closed: boolean): Point {
  const total = pathLength(points)
  if (!closed) {
    const idx = Math.min(points.length - 2, Math.floor(t * (points.length - 1)))
    const a = points[idx]
    const b = points[idx + 1]
    const f = t * (points.length - 1) - idx
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
  }
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

export function spawnParticles(current: number): Particle[] {
  const count = Math.min(30, Math.round(current * 4))
  return Array.from({ length: count }, (_, i) => ({ t: i / Math.max(count, 1) }))
}

export function advanceParticles(particles: Particle[], current: number, dt: number): void {
  const speed = Math.min(current * 0.08, 2.5)
  for (const p of particles) {
    p.t = (p.t + speed * dt) % 1
  }
}
