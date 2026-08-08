import { describe, expect, it } from 'vitest'
import { apparentRefractedAngle, pencilBendOffset } from './model'

describe('refraction boundary', () => {
  it('increases bend offset with angle', () => {
    expect(pencilBendOffset(0)).toBe(0)
    expect(pencilBendOffset(35)).toBeGreaterThan(pencilBendOffset(10))
    expect(pencilBendOffset(70)).toBeGreaterThan(pencilBendOffset(35))
  })

  it('refracts toward the normal in water', () => {
    expect(apparentRefractedAngle(40)).toBeLessThan(40)
  })
})
