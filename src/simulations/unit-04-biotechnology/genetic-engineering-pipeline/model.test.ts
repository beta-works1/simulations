import { describe, expect, it } from 'vitest'
import { clampPipeline, PIPELINE_STEPS, pipelineAt } from './model'

describe('genetic engineering pipeline', () => {
  it('orders donor → plasmid → recombinant → bacterium → protein', () => {
    expect(PIPELINE_STEPS.map((s) => s.id)).toEqual([
      'donor',
      'plasmid',
      'recombinant',
      'bacterium',
      'protein',
    ])
  })

  it('clamps index and returns recombinant at step 2', () => {
    expect(clampPipeline(-3)).toBe(0)
    expect(pipelineAt(2).id).toBe('recombinant')
  })
})
