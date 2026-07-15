/** Plasmid cut / gene insert / transformation stages. Model only; Canvas draws. */

export const PLASMID_STAGES = [
  'Cut plasmid',
  'Insert gene',
  'Join recombinant DNA',
  'Insert into bacterium',
  'Replication',
] as const

export const PLASMID_STAGE_DURATION = 1.65

export interface PlasmidState {
  t: number
  stage: number
}

export function createPlasmidState(): PlasmidState {
  return { t: 0, stage: 0 }
}

export function setPlasmidStage(s: PlasmidState, stage: number): PlasmidState {
  const next = Math.max(0, Math.min(PLASMID_STAGES.length - 1, Math.round(stage)))
  return { ...s, stage: next, t: 0 }
}

export function stepPlasmid(s: PlasmidState, dt: number, running: boolean): PlasmidState {
  if (!running || dt <= 0) return s
  let { t, stage } = s
  t += dt
  if (t > PLASMID_STAGE_DURATION) {
    t = 0
    stage = (stage + 1) % PLASMID_STAGES.length
  }
  return { t, stage }
}

export function plasmidStageProgress(s: PlasmidState): number {
  return s.t / PLASMID_STAGE_DURATION
}
