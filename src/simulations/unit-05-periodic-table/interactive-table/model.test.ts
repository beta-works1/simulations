import { describe, expect, it } from 'vitest'
import { ELEMENTS, elementBySymbol, elementByZ } from './model'

describe('interactive periodic table', () => {
  it('has the first 18 elements H→Ar', () => {
    expect(ELEMENTS).toHaveLength(18)
    expect(ELEMENTS[0].symbol).toBe('H')
    expect(ELEMENTS[17].symbol).toBe('Ar')
    expect(ELEMENTS.every((e, i) => e.Z === i + 1)).toBe(true)
  })

  it('looks up by Z and symbol with config / state', () => {
    const na = elementByZ(11)
    expect(na?.symbol).toBe('Na')
    expect(na?.config).toBe('2, 8, 1')
    expect(na?.state).toBe('solid')
    expect(elementBySymbol('Cl')?.mass).toBe(35.5)
  })
})
