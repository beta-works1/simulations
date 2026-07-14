/**
 * Projectile Motion — physics from PhET projectile-motion
 * (ProjectileMotionConstants.ts, Trajectory.ts, IntroModel.ts).
 * Units: meters, kilograms, seconds.
 */

export interface ProjectileType {
  id: string
  label: string
  mass: number
  diameter: number
  dragCoefficient: number
}

/** Intro screen object types (subset) from ProjectileObjectType.ts */
export const PROJECTILE_TYPES: ProjectileType[] = [
  { id: 'cannonball', label: 'Cannonball', mass: 17.6, diameter: 0.18, dragCoefficient: 0.47 },
  { id: 'pumpkin', label: 'Pumpkin', mass: 5, diameter: 0.37, dragCoefficient: 0.6 },
  { id: 'baseball', label: 'Baseball', mass: 0.15, diameter: 0.07, dragCoefficient: 0.35 },
  { id: 'golf', label: 'Golf ball', mass: 0.05, diameter: 0.04, dragCoefficient: 0.25 },
  { id: 'tank', label: 'Tank shell', mass: 42, diameter: 0.15, dragCoefficient: 0.06 },
]

export const PHET = {
  heightRange: [0, 15] as const,
  angleRange: [-90, 90] as const,
  speedRange: [0, 30] as const,
  gravityRange: [1, 20] as const,
  /** Sea-level air density (kg/m³) used when air resistance is on */
  airDensity: 1.225,
  defaultHeight: 10,
  defaultAngle: 0,
  defaultSpeed: 15,
  defaultGravity: 9.81,
  defaultTypeId: 'pumpkin',
}

export interface LaunchParams {
  height: number
  angleDeg: number
  speed: number
  gravity: number
  airResistance: boolean
  typeId: string
}

export interface FlightPoint {
  x: number
  y: number
  t: number
}

export interface FlightState {
  flying: boolean
  x: number
  y: number
  vx: number
  vy: number
  path: FlightPoint[]
  range: number
  apex: number
  flightTime: number
}

export function defaultLaunchParams(): LaunchParams {
  return {
    height: PHET.defaultHeight,
    angleDeg: PHET.defaultAngle,
    speed: PHET.defaultSpeed,
    gravity: PHET.defaultGravity,
    airResistance: false,
    typeId: PHET.defaultTypeId,
  }
}

export function emptyFlight(height: number): FlightState {
  return {
    flying: false,
    x: 0,
    y: height,
    vx: 0,
    vy: 0,
    path: [{ x: 0, y: height, t: 0 }],
    range: 0,
    apex: height,
    flightTime: 0,
  }
}

export function fireProjectile(params: LaunchParams): FlightState {
  const rad = (params.angleDeg * Math.PI) / 180
  return {
    flying: true,
    x: 0,
    y: params.height,
    vx: params.speed * Math.cos(rad),
    vy: params.speed * Math.sin(rad),
    path: [{ x: 0, y: params.height, t: 0 }],
    range: 0,
    apex: params.height,
    flightTime: 0,
  }
}

function dragForce(
  vx: number,
  vy: number,
  type: ProjectileType,
  airDensity: number,
): { fx: number; fy: number } {
  const speed = Math.hypot(vx, vy)
  if (speed < 1e-9 || airDensity <= 0) return { fx: 0, fy: 0 }
  const area = (Math.PI * type.diameter * type.diameter) / 4
  const mag = 0.5 * airDensity * area * type.dragCoefficient * speed
  return { fx: mag * vx, fy: mag * vy }
}

/** PhET Trajectory: a = (−Fd/m, −g − Fd_y/m); x += v Δt + ½ a Δt² */
export function stepFlight(
  flight: FlightState,
  params: LaunchParams,
  dt: number,
): FlightState {
  if (!flight.flying) return flight

  const type = PROJECTILE_TYPES.find((t) => t.id === params.typeId) ?? PROJECTILE_TYPES[1]
  const rho = params.airResistance ? PHET.airDensity : 0

  let { x, y, vx, vy, path, apex, flightTime } = flight
  let remaining = Math.min(dt, 0.05)

  while (remaining > 1e-6) {
    const step = Math.min(remaining, 0.012)
    const { fx, fy } = dragForce(vx, vy, type, rho)
    const ax = -fx / type.mass
    const ay = -params.gravity - fy / type.mass

    let nx = x + vx * step + 0.5 * ax * step * step
    let ny = y + vy * step + 0.5 * ay * step * step
    let nvx = vx + ax * step
    let nvy = vy + ay * step

    if (Math.sign(nvx) !== Math.sign(vx) && Math.abs(ax) > 1e-9) {
      const tFlip = -vx / ax
      nx = x + vx * tFlip + 0.5 * ax * tFlip * tFlip
      nvx = 0
    }

    if (ny <= 0) {
      const a = 0.5 * ay
      const b = vy
      const c = y
      let tGround = step
      if (Math.abs(a) < 1e-12) {
        tGround = Math.abs(b) > 1e-12 ? -c / b : 0
      } else {
        const disc = b * b - 4 * a * c
        if (disc >= 0) {
          const r = Math.sqrt(disc)
          const t1 = (-b - r) / (2 * a)
          const t2 = (-b + r) / (2 * a)
          tGround = [t1, t2].filter((t) => t > 0).sort((u, v) => u - v)[0] ?? step
        }
      }
      nx = x + vx * tGround + 0.5 * ax * tGround * tGround
      ny = 0
      flightTime += tGround
      path = [...path, { x: nx, y: 0, t: flightTime }]
      return {
        flying: false,
        x: nx,
        y: 0,
        vx: 0,
        vy: 0,
        path,
        range: nx,
        apex: Math.max(apex, y),
        flightTime,
      }
    }

    if (vy > 0 && nvy < 0) apex = Math.max(apex, ny)
    apex = Math.max(apex, ny)

    x = nx
    y = ny
    vx = nvx
    vy = nvy
    flightTime += step
    remaining -= step
  }

  path = [...path, { x, y, t: flightTime }]
  if (path.length > 400) path = path.slice(path.length - 400)

  return { flying: true, x, y, vx, vy, path, range: x, apex, flightTime }
}
