/** Ionic vs covalent bonding builder — Unit 6, p.73. */

export type BondMode = 'ionic' | 'covalent'

export interface BondingState {
  mode: BondMode
  example: string
  electronStory: string
  bondLabel: string
}

export function bondingFor(mode: BondMode): BondingState {
  if (mode === 'ionic') {
    return {
      mode,
      example: 'NaCl (sodium chloride)',
      electronStory:
        'Electron transfer: Na loses one electron (Na⁺); Cl gains that electron (Cl⁻). Opposite charges attract.',
      bondLabel: 'Ionic bond',
    }
  }
  return {
    mode,
    example: 'H₂ (hydrogen molecule)',
    electronStory:
      'Electron sharing: each H atom shares its electron so both have a stable pair (covalent bond).',
    bondLabel: 'Covalent bond',
  }
}
