import { describe, expect, it } from 'vitest'
import { GALAXIES, galaxyById } from './model'

describe('galaxy explorer', () => {
  it('lists spiral, elliptical, irregular', () => {
    expect(GALAXIES.map((g) => g.id)).toEqual(['spiral', 'elliptical', 'irregular'])
    expect(galaxyById('spiral').name).toBe('Spiral')
    expect(galaxyById('elliptical').blurb.length).toBeGreaterThan(10)
  })
})
