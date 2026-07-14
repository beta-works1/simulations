/**
 * Ohm's Law model — adapted from PhET Interactive Simulations
 * (phetsims/ohms-law OhmsLawModel.js + OhmsLawConstants.js).
 *
 * Current is computed as milliamps: I_mA = 1000 * V / R
 * Voltage range: 0.1–9 V (default 4.5)
 * Resistance range: 10–1000 Ω (default 500)
 */

export const PHET_VOLTAGE = { min: 0.1, max: 9, default: 4.5 } as const
export const PHET_RESISTANCE = { min: 10, max: 1000, default: 500 } as const
export const AA_VOLTAGE = 1.5

export interface OhmLawState {
  voltage: number
  resistance: number
  switchClosed: boolean
}

export const DEFAULT_OHM_LAW_STATE: OhmLawState = {
  voltage: PHET_VOLTAGE.default,
  resistance: PHET_RESISTANCE.default,
  switchClosed: true,
}

/** Current in milliamps (PhET's computeCurrent). */
export function computeCurrentMilliamps(voltage: number, resistance: number): number {
  if (resistance <= 0) return 0
  return (1000 * voltage) / resistance
}

export function computeCurrent(state: OhmLawState): number {
  if (!state.switchClosed) return 0
  return computeCurrentMilliamps(state.voltage, state.resistance)
}

export function currentAmps(milliamps: number): number {
  return milliamps / 1000
}

export function getMaxCurrentMilliamps(): number {
  return computeCurrentMilliamps(PHET_VOLTAGE.max, PHET_RESISTANCE.min)
}

export function getMinCurrentMilliamps(): number {
  return computeCurrentMilliamps(PHET_VOLTAGE.min, PHET_RESISTANCE.max)
}

export function normalizedVoltage(v: number): number {
  return (v - PHET_VOLTAGE.min) / (PHET_VOLTAGE.max - PHET_VOLTAGE.min)
}

export function normalizedResistance(r: number): number {
  return (r - PHET_RESISTANCE.min) / (PHET_RESISTANCE.max - PHET_RESISTANCE.min)
}

export function normalizedCurrent(mA: number): number {
  const min = getMinCurrentMilliamps()
  const max = getMaxCurrentMilliamps()
  return (mA - min) / (max - min)
}

/** PhET FormulaNode scaling: letter size tracks normalized magnitude. */
export function formulaLetterScale(kind: 'I' | 'V' | 'R', state: OhmLawState): number {
  const mA = computeCurrent(state)
  if (kind === 'I') return 1 + 4.5 * normalizedCurrent(mA)
  if (kind === 'V') return 1 + 1.6 * normalizedVoltage(state.voltage)
  return 1 + 1.6 * normalizedResistance(state.resistance)
}

/** How many AA cells to draw (PhET BatteriesView). */
export function batteryCount(voltage: number): number {
  return Math.max(1, Math.ceil(voltage / AA_VOLTAGE - 1e-9))
}

/** Normalized bulb glow 0–1 from milliamps. */
export function bulbBrightness(milliamps: number): number {
  return Math.min(1, milliamps / getMaxCurrentMilliamps())
}

export interface Point {
  x: number
  y: number
}

export function circuitLoop(w: number, h: number): Point[] {
  const cx = w * 0.5
  const cy = h * 0.58
  const hw = Math.min(w * 0.38, 280)
  const hh = Math.min(h * 0.28, 140)
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
  let dist = (((t % 1) + 1) % 1) * total
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

const MAX_PARTICLES = 28

export function spawnParticles(milliamps: number): Particle[] {
  const count = Math.min(MAX_PARTICLES, Math.max(0, Math.round((milliamps / getMaxCurrentMilliamps()) * 24)))
  return Array.from({ length: count }, (_, i) => ({ t: i / Math.max(count, 1) }))
}

export function advanceParticles(particles: Particle[], milliamps: number, dt: number): void {
  const speed = (milliamps / getMaxCurrentMilliamps()) * 0.55
  for (const p of particles) {
    p.t = (p.t + speed * dt) % 1
  }
}
