import { describe, expect, it } from 'vitest'
import { reflectionAt } from './model'

describe('reflection ray tracer', () => {
  it('keeps i = r for several incidence angles', () => {
    for (const ang of [0, 20, 45, 80]) {
      const res = reflectionAt(ang)
      expect(res.lawHolds).toBe(true)
      expect(res.incidenceDeg).toBeCloseTo(res.reflectionDeg, 5)
      expect(res.incidenceDeg).toBeCloseTo(ang, 5)
    }
  })

  it('clamps incidence to 0–80', () => {
    expect(reflectionAt(-10).incidenceDeg).toBeCloseTo(0, 5)
    expect(reflectionAt(90).incidenceDeg).toBeCloseTo(80, 5)
  })
})
