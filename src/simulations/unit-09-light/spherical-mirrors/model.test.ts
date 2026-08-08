import { describe, expect, it } from 'vitest'
import { DEFAULT_FOCAL, sphericalImage } from './model'

describe('spherical mirrors', () => {
  const f = DEFAULT_FOCAL
  const C = 2 * f

  it('concave beyond C → real inverted diminished', () => {
    const img = sphericalImage('concave', C + 10)
    expect(img.nature).toBe('real')
    expect(img.orientation).toBe('inverted')
    expect(img.size).toBe('diminished')
  })

  it('concave between F and C → real inverted enlarged', () => {
    const img = sphericalImage('concave', (f + C) / 2)
    expect(img.nature).toBe('real')
    expect(img.orientation).toBe('inverted')
    expect(img.size).toBe('enlarged')
  })

  it('concave inside F → virtual upright', () => {
    const img = sphericalImage('concave', f / 2)
    expect(img.nature).toBe('virtual')
    expect(img.orientation).toBe('upright')
    expect(img.size).toBe('enlarged')
  })

  it('convex always virtual upright diminished', () => {
    for (const u of [10, 25, 50]) {
      const img = sphericalImage('convex', u)
      expect(img.nature).toBe('virtual')
      expect(img.orientation).toBe('upright')
      expect(img.size).toBe('diminished')
    }
  })
})
