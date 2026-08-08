import { describe, expect, it } from 'vitest'
import { zoomFromLevel, ZOOM_LEVELS } from './model'

describe('dna zoom', () => {
  it('maps slider levels chromosome → helix → bases', () => {
    expect(zoomFromLevel(0).id).toBe('chromosome')
    expect(zoomFromLevel(1).id).toBe('helix')
    expect(zoomFromLevel(2).id).toBe('bases')
  })

  it('mentions base pairing at the closest zoom', () => {
    expect(ZOOM_LEVELS[2].detail).toMatch(/A pairs with T/i)
  })
})
