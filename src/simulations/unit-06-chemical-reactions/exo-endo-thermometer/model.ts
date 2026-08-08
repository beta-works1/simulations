/** Exothermic vs endothermic thermometer demo — Unit 6, p.67. */

export type ReactionKind = 'exo' | 'endo'

export interface ThermometerState {
  kind: ReactionKind
  label: string
  equation: string
  startTempC: number
  endTempC: number
  deltaC: number
  direction: 'rises' | 'falls'
}

const ROOM = 25

export function thermometerFor(kind: ReactionKind): ThermometerState {
  if (kind === 'exo') {
    // CaO + H₂O → Ca(OH)₂ releases heat
    const end = 55
    return {
      kind,
      label: 'Exothermic (CaO + H₂O)',
      equation: 'CaO + H₂O → Ca(OH)₂ + heat',
      startTempC: ROOM,
      endTempC: end,
      deltaC: end - ROOM,
      direction: 'rises',
    }
  }
  // Classroom endothermic: dissolving NH₄Cl or Ba(OH)₂ + NH₄Cl style cool-down
  const end = 8
  return {
    kind,
    label: 'Endothermic (dissolving NH₄Cl)',
    equation: 'NH₄Cl(s) + H₂O → NH₄⁺ + Cl⁻ (absorbs heat)',
    startTempC: ROOM,
    endTempC: end,
    deltaC: end - ROOM,
    direction: 'falls',
  }
}
