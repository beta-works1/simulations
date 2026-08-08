import { describe, expect, it } from 'vitest'
import { AREA_EDGE, AREA_FACE, pressure, sinkDepth } from './model'

describe('pressure force area', () => {
  it('computes P = F/A', () => {
    expect(pressure(100, AREA_FACE)).toBe(5)
    expect(pressure(100, AREA_EDGE)).toBe(50)
  })

  it('sinks deeper when area is smaller at the same force', () => {
    expect(sinkDepth(40, AREA_EDGE)).toBeGreaterThan(sinkDepth(40, AREA_FACE))
  })
})
