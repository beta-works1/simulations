import { describe, expect, it } from 'vitest'
import { clampStage, MITOSIS_STAGES, stageAt } from './model'

describe('mitosis stepper', () => {
  it('has five stages ending in telophase', () => {
    expect(MITOSIS_STAGES.map((s) => s.id)).toEqual([
      'interphase',
      'prophase',
      'metaphase',
      'anaphase',
      'telophase',
    ])
  })

  it('clamps stage index and returns metaphase at index 2', () => {
    expect(clampStage(-1)).toBe(0)
    expect(clampStage(99)).toBe(4)
    expect(stageAt(2).id).toBe('metaphase')
  })
})
