import { describe, expect, it } from 'vitest'
import { incidenceAngleDeg, reflect, refract, AIR_N, normalize } from './rayTracing'

describe('rayTracing', () => {
  it('keeps incidence angle equal to reflection angle (§9.2)', () => {
    // Horizontal mirror; normal points upward (−y in canvas-style, +y in math).
    const normal = { x: 0, y: 1 }
    const incident = normalize({ x: 1, y: -1 }) // coming down-right toward surface
    const reflected = reflect(incident, normal)
    expect(incidenceAngleDeg(incident, normal)).toBeCloseTo(
      incidenceAngleDeg(reflected, normal),
      5,
    )
    // Outgoing ray should go up-right
    expect(reflected.y).toBeGreaterThan(0)
    expect(reflected.x).toBeGreaterThan(0)
  })

  it('bends toward the normal when entering denser glass (Snell)', () => {
    const normal = { x: 0, y: 1 }
    const incident = normalize({ x: 1, y: -1 })
    const transmitted = refract(incident, normal, AIR_N, 1.5)
    expect(transmitted).not.toBeNull()
    expect(incidenceAngleDeg(transmitted!, normal)).toBeLessThan(
      incidenceAngleDeg(incident, normal),
    )
  })

  it('returns null on total internal reflection', () => {
    const normal = { x: 0, y: 1 }
    const incident = normalize({ x: 1, y: -0.05 }) // grazing from glass
    expect(refract(incident, normal, 1.5, AIR_N)).toBeNull()
  })
})
