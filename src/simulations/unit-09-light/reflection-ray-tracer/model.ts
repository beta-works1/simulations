import {
  fromAngleDeg,
  incidenceAngleDeg,
  normalize,
  reflect,
  type Vec2,
} from '../../../engine/rayTracing'

/** Law of reflection ray geometry — book §9.2, p.112. */

export interface ReflectionResult {
  incidenceDeg: number
  reflectionDeg: number
  incident: Vec2
  reflected: Vec2
  normal: Vec2
  /** Law check: i ≈ r */
  lawHolds: boolean
}

/**
 * Vertical mirror facing left. Normal = (−1, 0).
 * Incidence angle 0–80° measured from the normal.
 */
export function reflectionAt(incidenceDeg: number): ReflectionResult {
  const clamped = Math.max(0, Math.min(80, incidenceDeg))
  const normal = normalize({ x: -1, y: 0 })
  const incident = fromAngleDeg(clamped)
  const reflected = reflect(incident, normal)
  const i = incidenceAngleDeg(incident, normal)
  const r = incidenceAngleDeg(reflected, normal)
  return {
    incidenceDeg: i,
    reflectionDeg: r,
    incident,
    reflected,
    normal,
    lawHolds: Math.abs(i - r) < 0.5,
  }
}
