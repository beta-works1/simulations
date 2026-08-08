import { describe, expect, it } from 'vitest'
import { wiringSafety } from './model'

describe('home wiring safety', () => {
  it('flags fire risk only when overloaded without fuse', () => {
    expect(wiringSafety(false, true).fireRisk).toBe(false)
    expect(wiringSafety(true, true).fireRisk).toBe(false)
    expect(wiringSafety(true, false).fireRisk).toBe(true)
    expect(wiringSafety(false, false).fireRisk).toBe(false)
  })
})
