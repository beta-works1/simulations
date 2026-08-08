/** Mitosis stage stepper (book p.30). */

export type MitosisStageId =
  | 'interphase'
  | 'prophase'
  | 'metaphase'
  | 'anaphase'
  | 'telophase'

export type MitosisStage = { id: MitosisStageId; label: string; detail: string }

export const MITOSIS_STAGES: MitosisStage[] = [
  {
    id: 'interphase',
    label: 'Interphase',
    detail: 'Cell grows and DNA is copied before division.',
  },
  {
    id: 'prophase',
    label: 'Prophase',
    detail: 'Chromosomes condense; nuclear membrane starts to break down.',
  },
  {
    id: 'metaphase',
    label: 'Metaphase',
    detail: 'Chromosomes line up at the cell’s equator.',
  },
  {
    id: 'anaphase',
    label: 'Anaphase',
    detail: 'Sister chromatids separate and move to opposite poles.',
  },
  {
    id: 'telophase',
    label: 'Telophase',
    detail: 'Nuclear membranes reform; cell prepares to split (cytokinesis).',
  },
]

export function clampStage(index: number): number {
  return Math.max(0, Math.min(MITOSIS_STAGES.length - 1, index))
}

export function stageAt(index: number): MitosisStage {
  return MITOSIS_STAGES[clampStage(index)]
}
