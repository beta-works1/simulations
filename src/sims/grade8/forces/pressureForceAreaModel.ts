/** Pressure = force ÷ area — PTB Ch 3. Model only; Canvas draws state. */

export interface PressureState {
  pressDepth: number
  time: number
}

export function createPressureState(): PressureState {
  return { pressDepth: 0, time: 0 }
}

export function stepPressure(s: PressureState, dt: number, running: boolean): PressureState {
  let { pressDepth } = s
  if (running) pressDepth = Math.min(1, pressDepth + dt * 0.6)
  return { ...s, pressDepth, time: s.time + dt }
}

/** Pressure P = F / A — unchanged. */
export function calcPressure(force: number, area: number): number {
  return force / Math.max(0.5, area)
}
