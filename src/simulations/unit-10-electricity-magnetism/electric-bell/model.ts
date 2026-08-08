/** Electric bell make–break cycle — Unit 10, p.132. */

export type BellStageId = 0 | 1 | 2 | 3

export interface BellStage {
  id: BellStageId
  name: string
  detail: string
}

export const BELL_STAGES: BellStage[] = [
  {
    id: 0,
    name: 'Circuit closed',
    detail: 'Current flows through the electromagnet coils.',
  },
  {
    id: 1,
    name: 'Armature attracted',
    detail: 'Electromagnet pulls the soft-iron armature toward the pole.',
  },
  {
    id: 2,
    name: 'Hammer strikes',
    detail: 'Hammer hits the gong — you hear the ring.',
  },
  {
    id: 3,
    name: 'Contact breaks',
    detail: 'Make–break contact opens; current stops; spring returns armature; cycle repeats.',
  },
]

export function stageAt(index: number): BellStage {
  const i = ((Math.round(index) % BELL_STAGES.length) + BELL_STAGES.length) % BELL_STAGES.length
  return BELL_STAGES[i] as BellStage
}

export function nextStage(index: number): number {
  return (Math.round(index) + 1) % BELL_STAGES.length
}

export function prevStage(index: number): number {
  return (Math.round(index) - 1 + BELL_STAGES.length) % BELL_STAGES.length
}
