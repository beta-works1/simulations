/**
 * Gravity and Orbits — Newtonian gravity from PhET gravity-and-orbits masses.
 * Scales: scene uses AU-like units chosen so Earth orbits fit the canvas.
 */

export const G = 6.6743e-11

/** From GravityAndOrbitsConstants / SceneFactory (kg) */
export const EARTH_MASS = 5.9724e24
export const SUN_MASS = 1.989e30
export const MOON_MASS = 7.346e22

export type OrbitMode = 'sun-earth' | 'earth-moon'

export interface Body {
  id: string
  label: string
  mass: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  trail: { x: number; y: number }[]
}

export interface OrbitState {
  mode: OrbitMode
  gravityOn: boolean
  bodies: Body[]
  timeScale: number
}

/** Model meters → compact scene units (1 unit = 1e9 m for sun-earth, 1e6 for earth-moon) */
function sunEarthScene(): Body[] {
  const scale = 1e9
  const r = 1.47098074e11 / scale // perihelion ~1 AU in scene units
  const v = 30300 / scale // m/s → scene units / s
  return [
    {
      id: 'sun',
      label: 'Sun',
      mass: SUN_MASS,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 12,
      color: '#fbbf24',
      trail: [],
    },
    {
      id: 'earth',
      label: 'Earth',
      mass: EARTH_MASS,
      x: r,
      y: 0,
      vx: 0,
      vy: v,
      radius: 5,
      color: '#38bdf8',
      trail: [],
    },
  ]
}

function earthMoonScene(): Body[] {
  const scale = 1e6
  const r = 3.633e8 / scale
  const v = 1082 / scale
  return [
    {
      id: 'earth',
      label: 'Earth',
      mass: EARTH_MASS,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 14,
      color: '#38bdf8',
      trail: [],
    },
    {
      id: 'moon',
      label: 'Moon',
      mass: MOON_MASS,
      x: r,
      y: 0,
      vx: 0,
      vy: -v,
      radius: 4,
      color: '#cbd5e1',
      trail: [],
    },
  ]
}

export function createOrbitState(mode: OrbitMode = 'sun-earth'): OrbitState {
  return {
    mode,
    gravityOn: true,
    bodies: mode === 'sun-earth' ? sunEarthScene() : earthMoonScene(),
    timeScale: mode === 'sun-earth' ? 2e5 : 2e3,
  }
}

function accelOn(i: number, bodies: Body[], gravityOn: boolean, scale: number): { ax: number; ay: number } {
  if (!gravityOn) return { ax: 0, ay: 0 }
  let ax = 0
  let ay = 0
  const bi = bodies[i]
  for (let j = 0; j < bodies.length; j++) {
    if (i === j) continue
    const bj = bodies[j]
    const dx = bj.x - bi.x
    const dy = bj.y - bi.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1e-6) continue
    // Convert scene units back: force uses (distance * scale) meters
    const distM = dist * scale
    const a = (G * bj.mass) / (distM * distM)
    const aScene = a / scale // m/s² → scene/s²
    ax += (aScene * dx) / dist
    ay += (aScene * dy) / dist
  }
  return { ax, ay }
}

function scaleFor(mode: OrbitMode): number {
  return mode === 'sun-earth' ? 1e9 : 1e6
}

/** Velocity Verlet–style step (PhET-inspired) */
export function stepOrbit(state: OrbitState, dt: number): OrbitState {
  const h = dt * state.timeScale
  const scale = scaleFor(state.mode)
  const bodies = state.bodies.map((b) => ({ ...b, trail: [...b.trail] }))

  const acc0 = bodies.map((_, i) => accelOn(i, bodies, state.gravityOn, scale))

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    b.x += b.vx * h + 0.5 * acc0[i].ax * h * h
    b.y += b.vy * h + 0.5 * acc0[i].ay * h * h
  }

  const acc1 = bodies.map((_, i) => accelOn(i, bodies, state.gravityOn, scale))

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    b.vx += 0.5 * (acc0[i].ax + acc1[i].ax) * h
    b.vy += 0.5 * (acc0[i].ay + acc1[i].ay) * h
    if (i > 0) {
      b.trail.push({ x: b.x, y: b.y })
      if (b.trail.length > 220) b.trail.shift()
    }
  }

  return { ...state, bodies }
}
