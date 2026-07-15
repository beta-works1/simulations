/** Reflex arc pathway timing — PTB Ch 2. Model only; Canvas draws state. */

export interface ReflexState {
  progress: number
  viaBrain: boolean
  fired: boolean
}

export function createReflexState(viaBrain = false): ReflexState {
  return { progress: 0, viaBrain, fired: false }
}

export function stepReflex(s: ReflexState, dt: number, playing: boolean): ReflexState {
  if (!playing || !s.fired) return s
  const speed = s.viaBrain ? 0.32 : 0.62
  return { ...s, progress: Math.min(1, s.progress + dt * speed) }
}
