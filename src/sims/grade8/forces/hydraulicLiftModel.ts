/** Hydraulic lift (Pascal) — PTB Ch 3. Model only; Canvas draws state. */

export interface HydraulicState {
  liftHeight: number
  time: number
}

export function createHydraulicState(): HydraulicState {
  return { liftHeight: 0, time: 0 }
}

/** Pascal: F1/A1 = F2/A2 → F2 = F1 × (A2/A1) — unchanged. */
export function calcF2(f1: number, a1: number, a2: number): number {
  return f1 * (a2 / Math.max(0.5, a1))
}

export function stepHydraulic(
  s: HydraulicState,
  dt: number,
  f1: number,
  a1: number,
  a2: number,
  loadWeight: number,
  running: boolean,
): HydraulicState {
  // Pascal relation unchanged; only the visual lift eases toward up/down.
  const f2 = calcF2(f1, a1, a2)
  let { liftHeight } = s
  const target = running && f2 >= loadWeight ? 1 : running && f2 < loadWeight ? 0 : liftHeight
  const rate = f2 >= loadWeight ? 2.2 : 1.6
  const t = 1 - Math.exp(-rate * dt)
  liftHeight = liftHeight + (target - liftHeight) * t
  if (Math.abs(target - liftHeight) < 0.002) liftHeight = target
  return { ...s, liftHeight, time: s.time + dt }
}

export const LOAD_WEIGHT = 800
