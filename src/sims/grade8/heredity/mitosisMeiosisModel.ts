/** Mitosis vs meiosis stage sequence — PTB Ch 5. Model only; Canvas draws state. */

export type DivisionMode = 'mitosis' | 'meiosis'

export const MITOSIS_STAGES = [
  'Prophase',
  'Metaphase',
  'Anaphase',
  'Telophase',
  '2 identical cells',
] as const

export const MEIOSIS_STAGES = [
  'Prophase I',
  'Metaphase I',
  'Anaphase I',
  'Telophase I',
  'Meiosis II',
  '4 unique gametes',
] as const

export interface MitosisMeiosisState {
  stage: number
  accum: number
}

export function createMitosisMeiosisState(): MitosisMeiosisState {
  return { stage: 0, accum: 0 }
}

export function stagesForMode(mode: DivisionMode): readonly string[] {
  return mode === 'mitosis' ? MITOSIS_STAGES : MEIOSIS_STAGES
}

/** Jump to a stage index (clamped to meiosis range; callers should clamp to mode length). */
export function setMitosisStage(_s: MitosisMeiosisState, stage: number): MitosisMeiosisState {
  const next = Math.max(0, Math.min(MEIOSIS_STAGES.length - 1, Math.round(stage)))
  return { stage: next, accum: 0 }
}

export function stepMitosisMeiosis(
  s: MitosisMeiosisState,
  dt: number,
  running: boolean,
  stageCount: number,
): MitosisMeiosisState {
  if (!running || dt <= 0) return s
  let { stage, accum } = s
  accum += dt
  if (accum > 1.45) {
    accum = 0
    stage = (stage + 1) % stageCount
  }
  return { stage, accum }
}
