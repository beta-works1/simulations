import { describe, expect, it } from 'vitest'
import { isBalanced, netForce } from './model'

describe('balanced vs unbalanced forces', () => {
  it('computes net force as right minus left', () => {
    expect(netForce(5, 8)).toBe(3)
    expect(netForce(10, 4)).toBe(-6)
  })

  it('treats nearly equal forces as balanced', () => {
    expect(isBalanced(10, 10)).toBe(true)
    expect(isBalanced(10, 10.3)).toBe(true)
    expect(isBalanced(5, 12)).toBe(false)
  })
})
