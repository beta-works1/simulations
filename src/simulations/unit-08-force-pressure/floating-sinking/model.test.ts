import { describe, expect, it } from 'vitest'
import { WATER_DENSITY, buoyancyState, displacedVolumeFraction } from './model'

describe('floating sinking', () => {
  it('floats below water density and sinks above', () => {
    expect(buoyancyState(0.8, WATER_DENSITY)).toBe('floats')
    expect(buoyancyState(1.2, WATER_DENSITY)).toBe('sinks')
    expect(buoyancyState(1.0, WATER_DENSITY)).toBe('suspends')
  })

  it('reports displaced volume fraction for floating objects', () => {
    expect(displacedVolumeFraction(0.5)).toBeCloseTo(0.5)
    expect(displacedVolumeFraction(1.4)).toBe(1)
  })
})
