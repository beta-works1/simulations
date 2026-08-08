import { describe, expect, it } from 'vitest'
import { UNIT_TOKENS } from '../data/unitTokens'
import { simulationsRegistry } from '../data/simulations-registry'

describe('GS8 Phase 0 foundation', () => {
  it('defines 12 unit accent tokens', () => {
    expect(Object.keys(UNIT_TOKENS)).toHaveLength(12)
    expect(UNIT_TOKENS['unit-09'].accent).toMatch(/^#/)
  })

  it('registers the full GS8 curriculum set (reference + 37 sims)', () => {
    expect(simulationsRegistry.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        'reference-demo',
        'prism-dispersion-rainbow',
        'equation-balancer',
        'ph-indicator-lab',
        'star-life-cycle',
        'steam-builds',
      ]),
    )
    expect(simulationsRegistry).toHaveLength(38)
    expect(simulationsRegistry.filter((s) => s.priority === 'P0').length).toBeGreaterThanOrEqual(3)
  })
})
