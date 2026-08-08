import { describe, expect, it } from 'vitest'
import {
  EQUIVALENCE_DROPS,
  indicatorAppearance,
  isAtEquivalence,
  phFromDrops,
} from './model'

describe('neutralization titration', () => {
  it('pH falls as acid drops are added', () => {
    expect(phFromDrops(0)).toBeGreaterThan(phFromDrops(10))
    expect(phFromDrops(10)).toBeGreaterThan(phFromDrops(20))
    expect(phFromDrops(20)).toBeGreaterThan(phFromDrops(30))
  })

  it('turns pink→clear at equivalence', () => {
    expect(indicatorAppearance(0).label).toMatch(/Pink/i)
    expect(isAtEquivalence(EQUIVALENCE_DROPS)).toBe(true)
    expect(indicatorAppearance(EQUIVALENCE_DROPS).label).toMatch(/Clear/i)
    expect(indicatorAppearance(25).label).toMatch(/Clear/i)
  })
})
