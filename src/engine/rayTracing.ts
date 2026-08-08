/**
 * Pure optics helpers for Unit 9 light sims.
 * Book §9.2 law of reflection; Snell's law for refraction / dispersion (Fig 9.15, §9.4.4).
 */

export type Vec2 = { x: number; y: number }

export function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1
  return { x: v.x / len, y: v.y / len }
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s }
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

/** Angle of a direction vector in degrees, 0 = +x, positive = CCW. */
export function angleDeg(v: Vec2): number {
  return (Math.atan2(v.y, v.x) * 180) / Math.PI
}

export function fromAngleDeg(deg: number): Vec2 {
  const r = (deg * Math.PI) / 180
  return { x: Math.cos(r), y: Math.sin(r) }
}

/**
 * Law of reflection: θ_i = θ_r about the surface normal.
 * `incident` points toward the surface; returned ray points away.
 * Book §9.2.
 */
export function reflect(incident: Vec2, normal: Vec2): Vec2 {
  const i = normalize(incident)
  const n = normalize(normal)
  // Ensure normal faces against the incoming ray
  const facing = dot(i, n) > 0 ? scale(n, -1) : n
  const reflected = add(i, scale(facing, -2 * dot(i, facing)))
  return normalize(reflected)
}

/**
 * Snell's law refraction. Returns null on total internal reflection.
 * `n1` / `n2` are refractive indices of the incident / transmitted media.
 * `incident` points toward the interface.
 */
export function refract(incident: Vec2, normal: Vec2, n1: number, n2: number): Vec2 | null {
  const i = normalize(incident)
  let n = normalize(normal)
  let cosi = -dot(n, i)
  let eta = n1 / n2
  if (cosi < 0) {
    // Ray coming from the other side — flip normal and swap media
    n = scale(n, -1)
    cosi = -cosi
    eta = n2 / n1
  }
  const k = 1 - eta * eta * (1 - cosi * cosi)
  if (k < 0) return null
  return normalize(add(scale(i, eta), scale(n, eta * cosi - Math.sqrt(k))))
}

/** Degrees between incident direction and the (outward-facing) normal. */
export function incidenceAngleDeg(incident: Vec2, normal: Vec2): number {
  const i = normalize(incident)
  let n = normalize(normal)
  let c = -dot(n, i)
  if (c < 0) {
    n = scale(n, -1)
    c = -dot(n, i)
  }
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI
}

/** ROYGBIV relative refractive indices (glass, approximate, for dispersion fan). */
export const SPECTRUM = [
  { name: 'R', color: '#e74c3c', n: 1.514 },
  { name: 'O', color: '#e67e22', n: 1.517 },
  { name: 'Y', color: '#f1c40f', n: 1.52 },
  { name: 'G', color: '#2ecc71', n: 1.523 },
  { name: 'B', color: '#3498db', n: 1.528 },
  { name: 'I', color: '#6c5ce7', n: 1.532 },
  { name: 'V', color: '#9b59b6', n: 1.536 },
] as const

export const AIR_N = 1.0
export const WATER_N = 1.333
