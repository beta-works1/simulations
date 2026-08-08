import { describe, expect, it } from 'vitest'
import { electromagnetStrength } from './model'

describe('electromagnet strength', () => {
  it('computes paperclips = floor(turns × current × 0.4)', () => {
    expect(electromagnetStrength(10, 2).paperclips).toBe(Math.floor(10 * 2 * 0.4))
    expect(electromagnetStrength(50, 5).paperclips).toBe(Math.floor(50 * 5 * 0.4))
    expect(electromagnetStrength(1, 0).paperclips).toBe(0)
  })

  it('clamps turns and current', () => {
    expect(electromagnetStrength(100, 10).turns).toBe(50)
    expect(electromagnetStrength(100, 10).current).toBe(5)
    expect(electromagnetStrength(0, -1).turns).toBe(1)
    expect(electromagnetStrength(0, -1).current).toBe(0)
  })
})
