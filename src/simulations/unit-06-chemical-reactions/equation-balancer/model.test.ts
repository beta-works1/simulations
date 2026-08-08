import { describe, expect, it } from 'vitest'
import { EQUATIONS, defaultCoefs, elementStatus, isFullyBalanced } from './model'

describe('equation balancer', () => {
  it('detects unbalanced CaCl₂ equation at all-ones coefficients', () => {
    const eq = EQUATIONS[0]
    const coefs = defaultCoefs(eq)
    expect(isFullyBalanced(eq.reactants, eq.products, coefs)).toBe(false)
    const cl = elementStatus(eq.reactants, eq.products, coefs).find((r) => r.element === 'Cl')
    expect(cl?.balanced).toBe(false)
  })

  it('accepts the book-balanced CaCl₂ solution (NaCl coefficient 2)', () => {
    const eq = EQUATIONS[0]
    expect(isFullyBalanced(eq.reactants, eq.products, eq.balanced)).toBe(true)
  })
})
