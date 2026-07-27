/** Acid–base neutralization — PTB Ch 7. Model only; Canvas draws state. */

export interface NeutralizationState {
  acidVol: number
  baseVol: number
  mixedAcid: number
  mixedBase: number
  ph: number
  pourProgress: number
  time: number
}

export function createNeutralizationState(): NeutralizationState {
  return {
    acidVol: 50,
    baseVol: 50,
    mixedAcid: 0,
    mixedBase: 0,
    ph: 2,
    pourProgress: 0,
    time: 0,
  }
}

/** Strong acid + strong base → salt + water; pH from excess reagent. */
export function stepNeutralization(
  s: NeutralizationState,
  dt: number,
  acidTarget: number,
  baseTarget: number,
): NeutralizationState {
  const pourSpeed = 0.35
  let { mixedAcid, mixedBase, pourProgress } = s
  pourProgress = Math.min(1, pourProgress + dt * pourSpeed)

  mixedAcid = acidTarget * pourProgress
  mixedBase = baseTarget * pourProgress

  const neutralized = Math.min(mixedAcid, mixedBase)
  const excessAcid = mixedAcid - neutralized
  const excessBase = mixedBase - neutralized

  let ph = 7
  if (excessAcid > 0.5) ph = 7 - Math.min(6, excessAcid / Math.max(1, acidTarget) * 6)
  else if (excessBase > 0.5) ph = 7 + Math.min(6, excessBase / Math.max(1, baseTarget) * 6)

  return {
    ...s,
    acidVol: acidTarget,
    baseVol: baseTarget,
    mixedAcid,
    mixedBase,
    ph,
    pourProgress,
    time: s.time + dt,
  }
}
