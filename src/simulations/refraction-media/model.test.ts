import { describe, expect, it } from 'vitest'
import { N_AIR, clampIncidence, snellRefractedAngle } from './model'

describe('snellRefractedAngle', () => {
  it('bends toward the normal when entering denser medium (air → water)', () => {
    const r = snellRefractedAngle(40, N_AIR, 1.333)
    expect(r).not.toBeNull()
    expect(r!).toBeLessThan(40)
    expect(r!).toBeGreaterThan(25)
  })

  it('bends more for higher n (air → diamond)', () => {
    const water = snellRefractedAngle(40, N_AIR, 1.333)!
    const diamond = snellRefractedAngle(40, N_AIR, 2.419)!
    expect(diamond).toBeLessThan(water)
  })

  it('returns null for TIR when going from dense to rare at steep angle', () => {
    const r = snellRefractedAngle(50, 1.5, N_AIR)
    expect(r).toBeNull()
  })

  it('returns ~0 for normal incidence', () => {
    const r = snellRefractedAngle(0, N_AIR, 1.5)
    expect(r).toBeCloseTo(0, 5)
  })
})

describe('clampIncidence', () => {
  it('clamps to 0..85', () => {
    expect(clampIncidence(-10)).toBe(0)
    expect(clampIncidence(40)).toBe(40)
    expect(clampIncidence(99)).toBe(85)
  })
})
