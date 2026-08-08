import { describe, expect, it } from 'vitest'
import { nextHighlight, PATHWAY_STEPS, responseFor } from './model'

describe('reflex arc', () => {
  it('advances highlight along the five pathway steps', () => {
    expect(nextHighlight(-1)).toBe(0)
    expect(nextHighlight(0)).toBe(1)
    expect(nextHighlight(PATHWAY_STEPS.length - 1)).toBe(PATHWAY_STEPS.length - 1)
  })

  it('maps stimuli to protective responses', () => {
    expect(responseFor('hot')).toMatch(/pulls away/i)
    expect(responseFor('bright')).toMatch(/Pupil/i)
  })
})
