import { describe, expect, it } from 'vitest'
import { evidenceState } from './model'

describe('black hole evidence', () => {
  it('mentions wobble and GW when flags are on', () => {
    expect(evidenceState(true, false).caption).toMatch(/wobble/i)
    expect(evidenceState(false, true).caption).toMatch(/gravitational|ripple/i)
    expect(evidenceState(true, true).playWobble).toBe(true)
    expect(evidenceState(true, true).showGwRipple).toBe(true)
  })
})
