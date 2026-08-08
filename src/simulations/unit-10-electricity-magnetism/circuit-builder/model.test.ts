import { describe, expect, it } from 'vitest'
import { BULB_RESISTANCE, CELL_VOLTAGE, evaluateCircuit } from './model'

describe('circuit builder', () => {
  it('flows current only on a closed circuit with cell and bulb', () => {
    expect(evaluateCircuit(true, true, true).currentFlows).toBe(true)
    expect(evaluateCircuit(true, false, true).currentFlows).toBe(false)
    expect(evaluateCircuit(false, true, true).currentFlows).toBe(false)
    expect(evaluateCircuit(true, true, false).currentFlows).toBe(false)
  })

  it('uses V = 1.5 and I = V/R with R = 3', () => {
    const s = evaluateCircuit(true, true, true)
    expect(s.voltage).toBe(CELL_VOLTAGE)
    expect(s.current).toBeCloseTo(CELL_VOLTAGE / BULB_RESISTANCE, 5)
    expect(evaluateCircuit(false, true, true).voltage).toBe(0)
    expect(evaluateCircuit(false, true, true).current).toBe(0)
  })
})
