/** Greenhouse / global warming mechanism. Model only; Canvas draws state. */

export interface GreenhouseState {
  co2Level: number
  temperature: number
  time: number
}

export function createGreenhouseState(): GreenhouseState {
  return { co2Level: 0.4, temperature: 15, time: 0 }
}

export function stepGreenhouse(s: GreenhouseState, dt: number): GreenhouseState {
  const target = 10 + s.co2Level * 28
  const temperature = s.temperature + (target - s.temperature) * Math.min(1, dt * 0.35)
  return { ...s, temperature, time: s.time + dt }
}
