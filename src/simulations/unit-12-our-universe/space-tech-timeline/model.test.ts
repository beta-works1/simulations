import { describe, expect, it } from 'vitest'
import { TIMELINE, timelineItem } from './model'

describe('space tech timeline', () => {
  it('includes Hubble, probes, and tech', () => {
    expect(TIMELINE.map((t) => t.id)).toEqual(['hubble', 'probes', 'tech'])
    expect(timelineItem('hubble').title).toMatch(/Hubble/i)
    expect(timelineItem('probes').detail.length).toBeGreaterThan(10)
  })
})
