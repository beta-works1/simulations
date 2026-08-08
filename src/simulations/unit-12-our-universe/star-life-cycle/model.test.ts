import { describe, expect, it } from 'vitest'
import { lifePathSummary, remnantForMass, stageForMass } from './model'

describe('star life cycle', () => {
  it('ends as WD for low/medium mass', () => {
    expect(remnantForMass(1)).toBe('WD')
    expect(stageForMass(1, true)).toBe('White dwarf (WD)')
    expect(lifePathSummary(1)).toMatch(/White dwarf \(WD\)/)
  })

  it('ends as NS or BH for high mass', () => {
    expect(remnantForMass(15)).toBe('NS')
    expect(stageForMass(15, true)).toBe('Neutron star (NS)')
    expect(remnantForMass(30)).toBe('BH')
    expect(stageForMass(30, true)).toBe('Black hole (BH)')
  })
})
