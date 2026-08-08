/** Reflex arc pathway steps (book p.20). */

export type StimulusId = 'hot' | 'pin' | 'bright'

export type PathwayStepId = 'receptor' | 'sensory' | 'spinal' | 'motor' | 'effector'

export type PathwayStep = { id: PathwayStepId; label: string }

export const PATHWAY_STEPS: PathwayStep[] = [
  { id: 'receptor', label: 'Receptor' },
  { id: 'sensory', label: 'Sensory neuron' },
  { id: 'spinal', label: 'Spinal cord' },
  { id: 'motor', label: 'Motor neuron' },
  { id: 'effector', label: 'Effector' },
]

export const STIMULI: { id: StimulusId; label: string; response: string }[] = [
  { id: 'hot', label: 'Hot object', response: 'Hand pulls away' },
  { id: 'pin', label: 'Pin prick', response: 'Limb withdraws' },
  { id: 'bright', label: 'Bright light', response: 'Pupil shrinks' },
]

/** Highlight index advances 0→4 after a stimulus; -1 = idle. */
export function nextHighlight(current: number): number {
  if (current < 0) return 0
  if (current >= PATHWAY_STEPS.length - 1) return PATHWAY_STEPS.length - 1
  return current + 1
}

export function responseFor(stimulus: StimulusId): string {
  return STIMULI.find((s) => s.id === stimulus)?.response ?? ''
}
