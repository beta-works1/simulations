/** Simple series cell–switch–bulb circuit — Activity 10.1, p.126. */

export const CELL_VOLTAGE = 1.5
export const BULB_RESISTANCE = 3

export interface CircuitState {
  cellOn: boolean
  switchClosed: boolean
  bulbPresent: boolean
  /** Closed path with cell and bulb. */
  currentFlows: boolean
  voltage: number
  current: number
  resistance: number
}

/**
 * Voltage = 1.5 V when cell is on (else 0).
 * Current I = V/R with R = 3 Ω when bulb is present and circuit is closed.
 */
export function evaluateCircuit(
  cellOn: boolean,
  switchClosed: boolean,
  bulbPresent: boolean,
): CircuitState {
  const voltage = cellOn ? CELL_VOLTAGE : 0
  const resistance = bulbPresent ? BULB_RESISTANCE : Infinity
  const currentFlows = cellOn && switchClosed && bulbPresent
  const current = currentFlows ? voltage / BULB_RESISTANCE : 0
  return {
    cellOn,
    switchClosed,
    bulbPresent,
    currentFlows,
    voltage,
    current,
    resistance,
  }
}
