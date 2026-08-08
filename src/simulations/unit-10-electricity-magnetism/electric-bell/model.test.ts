import { describe, expect, it } from 'vitest'
import { BELL_STAGES, nextStage, prevStage, stageAt } from './model'

describe('electric bell', () => {
  it('has four make–break stages', () => {
    expect(BELL_STAGES).toHaveLength(4)
    expect(stageAt(0).name).toMatch(/closed/i)
    expect(stageAt(3).name).toMatch(/breaks/i)
  })

  it('steps forward and wraps', () => {
    expect(nextStage(3)).toBe(0)
    expect(prevStage(0)).toBe(3)
  })
})
