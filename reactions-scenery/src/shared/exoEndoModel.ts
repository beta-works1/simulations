export type ThermicMode = 'exothermic' | 'endothermic'

export interface ThermicState {
  temperature: number
  time: number
}

const BASE_TEMP = 22
const EXO_TARGET = 48
const ENDO_TARGET = 8

export function createThermicState(): ThermicState {
  return { temperature: BASE_TEMP, time: 0 }
}

export function stepThermic(s: ThermicState, dt: number, mode: ThermicMode, running: boolean): ThermicState {
  if (!running) return s
  const target = mode === 'exothermic' ? EXO_TARGET : ENDO_TARGET
  const rate = mode === 'exothermic' ? 0.55 : 0.45
  const temperature = s.temperature + (target - s.temperature) * Math.min(1, dt * rate)
  return { temperature, time: s.time + dt }
}

export function resetThermicState(): ThermicState {
  return createThermicState()
}
