/** Lotka–Volterra style predator–prey model (discrete Euler). */

export interface PredatorPreyState {
  prey: number
  predators: number
  growth: number
  predation: number
  predatorGrowth: number
  death: number
  history: { prey: number; predators: number }[]
  time: number
  mode: 'predation' | 'competition' | 'mutualism'
}

export function createPredatorPreyState(): PredatorPreyState {
  return {
    prey: 40,
    predators: 12,
    growth: 1.1,
    predation: 0.028,
    predatorGrowth: 0.025,
    death: 0.7,
    history: [],
    time: 0,
    mode: 'predation',
  }
}

export function stepPredatorPrey(s: PredatorPreyState, dt: number): PredatorPreyState {
  const steps = Math.max(1, Math.floor(dt / 0.016))
  let { prey, predators } = s
  const h = dt / steps

  for (let i = 0; i < steps; i++) {
    if (s.mode === 'predation') {
      const dp = s.growth * prey - s.predation * prey * predators
      const dq = s.predatorGrowth * prey * predators - s.death * predators
      prey += dp * h
      predators += dq * h
    } else if (s.mode === 'competition') {
      const dp = s.growth * prey * (1 - prey / 80) - 0.015 * prey * predators
      const dq = 0.9 * predators * (1 - predators / 50) - 0.012 * prey * predators
      prey += dp * h
      predators += dq * h
    } else {
      const dp = s.growth * prey * (1 - prey / 90) + 0.01 * prey * predators
      const dq = 0.6 * predators * (1 - predators / 60) + 0.008 * prey * predators
      prey += dp * h
      predators += dq * h
    }
    prey = Math.max(0.5, Math.min(120, prey))
    predators = Math.max(0.5, Math.min(80, predators))
  }

  const history = [...s.history, { prey, predators }]
  if (history.length > 180) history.shift()

  return { ...s, prey, predators, history, time: s.time + dt }
}
