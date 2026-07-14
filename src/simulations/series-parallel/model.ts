export type CircuitMode = 'series' | 'parallel'

export interface SeriesParallelState {
  mode: CircuitMode
  voltage: number
  bulbResistance: number
}

export const DEFAULT_SERIES_PARALLEL_STATE: SeriesParallelState = {
  mode: 'series',
  voltage: 9,
  /** CCKCConstants.DEFAULT_RESISTANCE */
  bulbResistance: 10,
}

export interface CircuitReadout {
  totalResistance: number
  totalCurrent: number
  bulbCurrent: number
  bulbBrightness: number
}

export function computeCircuit(state: SeriesParallelState): CircuitReadout {
  const { voltage, bulbResistance: r } = state
  if (r <= 0) {
    return { totalResistance: 0, totalCurrent: 0, bulbCurrent: 0, bulbBrightness: 0 }
  }

  if (state.mode === 'series') {
    const totalResistance = 2 * r
    const totalCurrent = voltage / totalResistance
    const bulbCurrent = totalCurrent
    const bulbBrightness = Math.min(1, bulbCurrent)
    return { totalResistance, totalCurrent, bulbCurrent, bulbBrightness }
  }

  const totalResistance = r / 2
  const totalCurrent = voltage / totalResistance
  const bulbCurrent = totalCurrent / 2
  const bulbBrightness = Math.min(1, bulbCurrent * 2)
  return { totalResistance, totalCurrent, bulbCurrent, bulbBrightness }
}

export interface Point {
  x: number
  y: number
}

export function seriesLoop(w: number, h: number): Point[] {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.36, 260)
  const hh = Math.min(h * 0.3, 150)
  return [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ]
}

export function parallelLoops(w: number, h: number): { top: Point[]; bottom: Point[]; shared: Point[] } {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.36, 260)
  const gap = Math.min(h * 0.14, 70)
  const hh = Math.min(h * 0.22, 110)

  const left = cx - hw
  const right = cx + hw
  const midTop = cy - gap
  const midBot = cy + gap

  return {
    top: [
      { x: left, y: midTop - hh },
      { x: right, y: midTop - hh },
      { x: right, y: midTop + hh },
      { x: left, y: midTop + hh },
    ],
    bottom: [
      { x: left, y: midBot - hh },
      { x: right, y: midBot - hh },
      { x: right, y: midBot + hh },
      { x: left, y: midBot + hh },
    ],
    shared: [
      { x: left, y: midTop - hh },
      { x: left, y: midBot + hh },
      { x: right, y: midBot + hh },
      { x: right, y: midTop - hh },
    ],
  }
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
  branch: 0 | 1
}

export function spawnParticles(current: number, mode: CircuitMode): Particle[] {
  const max = mode === 'series' ? 20 : 28
  const count = Math.min(max, Math.round(current * 10))
  if (mode === 'series') {
    return Array.from({ length: count }, (_, i) => ({ t: i / Math.max(count, 1), branch: 0 }))
  }
  const perBranch = Math.max(1, Math.floor(count / 2))
  const particles: Particle[] = []
  for (let b = 0; b < 2; b++) {
    for (let i = 0; i < perBranch; i++) {
      particles.push({ t: i / perBranch, branch: b as 0 | 1 })
    }
  }
  return particles
}

export function advanceParticles(particles: Particle[], current: number, dt: number): void {
  const speed = current * 0.3
  for (const p of particles) {
    p.t = (p.t + speed * dt) % 1
  }
}
