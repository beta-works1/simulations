/** Yeast fermentation kinetics — PTB Ch 6. Model only; Canvas draws state. */

export interface FermentState {
  sugar: number
  alcohol: number
  co2: number
  yeast: number
  temp: number
  time: number
}

export function createFermentState(): FermentState {
  return { sugar: 100, alcohol: 0, co2: 0, yeast: 20, temp: 0.6, time: 0 }
}

export function stepFerment(s: FermentState, dt: number): FermentState {
  const rate = s.temp * s.yeast * 0.04 * dt
  const used = Math.min(s.sugar, rate * 8)
  return {
    ...s,
    sugar: Math.max(0, s.sugar - used),
    alcohol: Math.min(100, s.alcohol + used * 0.45),
    co2: Math.min(100, s.co2 + used * 0.55),
    yeast: Math.min(80, s.yeast + used * 0.05 * s.temp),
    time: s.time + dt,
  }
}
