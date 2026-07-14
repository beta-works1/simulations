/**
 * Build an Atom — bucket limits from PhET BAAModel.ts
 * MAX_PROTONS=10, MAX_NEUTRONS=13, MAX_ELECTRONS=10
 */

export const MAX_PROTONS = 10
export const MAX_NEUTRONS = 13
export const MAX_ELECTRONS = 10

const ELEMENTS: Record<number, string> = {
  0: 'Empty',
  1: 'Hydrogen',
  2: 'Helium',
  3: 'Lithium',
  4: 'Beryllium',
  5: 'Boron',
  6: 'Carbon',
  7: 'Nitrogen',
  8: 'Oxygen',
  9: 'Fluorine',
  10: 'Neon',
}

const SYMBOLS: Record<number, string> = {
  0: '—',
  1: 'H',
  2: 'He',
  3: 'Li',
  4: 'Be',
  5: 'B',
  6: 'C',
  7: 'N',
  8: 'O',
  9: 'F',
  10: 'Ne',
}

export interface AtomState {
  protons: number
  neutrons: number
  electrons: number
}

export function defaultAtomState(): AtomState {
  return { protons: 1, neutrons: 0, electrons: 1 }
}

export function elementName(protons: number): string {
  return ELEMENTS[protons] ?? `Z = ${protons}`
}

export function elementSymbol(protons: number): string {
  return SYMBOLS[protons] ?? String(protons)
}

export function netCharge(state: AtomState): number {
  return state.protons - state.electrons
}

export function massNumber(state: AtomState): number {
  return state.protons + state.neutrons
}

export function chargeLabel(q: number): string {
  if (q === 0) return '0 (neutral)'
  if (q > 0) return `+${q}`
  return String(q)
}

export function clampAtom(partial: Partial<AtomState>, prev: AtomState): AtomState {
  return {
    protons: Math.max(0, Math.min(MAX_PROTONS, partial.protons ?? prev.protons)),
    neutrons: Math.max(0, Math.min(MAX_NEUTRONS, partial.neutrons ?? prev.neutrons)),
    electrons: Math.max(0, Math.min(MAX_ELECTRONS, partial.electrons ?? prev.electrons)),
  }
}
