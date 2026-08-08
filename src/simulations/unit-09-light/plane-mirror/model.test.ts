import { describe, expect, it } from 'vitest'
import { planeMirrorImage } from './model'

describe('plane mirror', () => {
  it('places the image at mirrored x with equal distance', () => {
    const s = planeMirrorImage(12)
    expect(s.objectX).toBe(-12)
    expect(s.imageX).toBe(12)
    expect(s.distanceEqual).toBe(true)
    expect(Math.abs(s.objectX)).toBe(Math.abs(s.imageX))
  })

  it('keeps object and image equidistant for other positions', () => {
    const s = planeMirrorImage(5.5)
    expect(s.objectDistance).toBe(5.5)
    expect(s.imageX).toBe(-s.objectX)
  })
})
