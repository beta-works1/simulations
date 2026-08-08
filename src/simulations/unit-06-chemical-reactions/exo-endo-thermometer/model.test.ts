import { describe, expect, it } from 'vitest'
import { thermometerFor } from './model'

describe('exo-endo thermometer', () => {
  it('raises temperature for exothermic CaO + H₂O', () => {
    const s = thermometerFor('exo')
    expect(s.direction).toBe('rises')
    expect(s.endTempC).toBeGreaterThan(s.startTempC)
    expect(s.equation).toMatch(/CaO/)
  })

  it('lowers temperature for endothermic reaction', () => {
    const s = thermometerFor('endo')
    expect(s.direction).toBe('falls')
    expect(s.endTempC).toBeLessThan(s.startTempC)
  })
})
