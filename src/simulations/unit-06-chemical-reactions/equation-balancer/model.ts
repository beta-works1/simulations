/** Equation balancer model — Law of Conservation of Mass (Activity 6.3, p.63). */

export interface Species {
  id: string
  label: string
  /** Atom counts in one formula unit */
  atoms: Record<string, number>
}

export interface EquationDef {
  id: string
  label: string
  reactants: Species[]
  products: Species[]
  /** Target coefficients keyed by species id */
  balanced: Record<string, number>
}

export const EQUATIONS: EquationDef[] = [
  {
    id: 'cacl2',
    label: 'CaCl₂ + Na₂CO₃ → CaCO₃ + NaCl',
    reactants: [
      { id: 'CaCl2', label: 'CaCl₂', atoms: { Ca: 1, Cl: 2 } },
      { id: 'Na2CO3', label: 'Na₂CO₃', atoms: { Na: 2, C: 1, O: 3 } },
    ],
    products: [
      { id: 'CaCO3', label: 'CaCO₃', atoms: { Ca: 1, C: 1, O: 3 } },
      { id: 'NaCl', label: 'NaCl', atoms: { Na: 1, Cl: 1 } },
    ],
    balanced: { CaCl2: 1, Na2CO3: 1, CaCO3: 1, NaCl: 2 },
  },
  {
    id: 'h2o',
    label: 'H₂ + O₂ → H₂O',
    reactants: [
      { id: 'H2', label: 'H₂', atoms: { H: 2 } },
      { id: 'O2', label: 'O₂', atoms: { O: 2 } },
    ],
    products: [{ id: 'H2O', label: 'H₂O', atoms: { H: 2, O: 1 } }],
    balanced: { H2: 2, O2: 1, H2O: 2 },
  },
  {
    id: 'nh3',
    label: 'N₂ + H₂ → NH₃',
    reactants: [
      { id: 'N2', label: 'N₂', atoms: { N: 2 } },
      { id: 'H2', label: 'H₂', atoms: { H: 2 } },
    ],
    products: [{ id: 'NH3', label: 'NH₃', atoms: { N: 1, H: 3 } }],
    balanced: { N2: 1, H2: 3, NH3: 2 },
  },
  {
    id: 'fe',
    label: 'Fe + O₂ → Fe₂O₃',
    reactants: [
      { id: 'Fe', label: 'Fe', atoms: { Fe: 1 } },
      { id: 'O2', label: 'O₂', atoms: { O: 2 } },
    ],
    products: [{ id: 'Fe2O3', label: 'Fe₂O₃', atoms: { Fe: 2, O: 3 } }],
    balanced: { Fe: 4, O2: 3, Fe2O3: 2 },
  },
  {
    id: 'ch4',
    label: 'CH₄ + O₂ → CO₂ + H₂O',
    reactants: [
      { id: 'CH4', label: 'CH₄', atoms: { C: 1, H: 4 } },
      { id: 'O2', label: 'O₂', atoms: { O: 2 } },
    ],
    products: [
      { id: 'CO2', label: 'CO₂', atoms: { C: 1, O: 2 } },
      { id: 'H2O', label: 'H₂O', atoms: { H: 2, O: 1 } },
    ],
    balanced: { CH4: 1, O2: 2, CO2: 1, H2O: 2 },
  },
]

export function countSide(species: Species[], coefs: Record<string, number>): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const s of species) {
    const c = coefs[s.id] ?? 1
    for (const [atom, n] of Object.entries(s.atoms)) {
      totals[atom] = (totals[atom] ?? 0) + n * c
    }
  }
  return totals
}

export function elementStatus(
  reactants: Species[],
  products: Species[],
  coefs: Record<string, number>,
): { element: string; left: number; right: number; balanced: boolean }[] {
  const L = countSide(reactants, coefs)
  const R = countSide(products, coefs)
  const keys = [...new Set([...Object.keys(L), ...Object.keys(R)])].sort()
  return keys.map((element) => {
    const left = L[element] ?? 0
    const right = R[element] ?? 0
    return { element, left, right, balanced: left === right }
  })
}

export function isFullyBalanced(
  reactants: Species[],
  products: Species[],
  coefs: Record<string, number>,
): boolean {
  return elementStatus(reactants, products, coefs).every((row) => row.balanced)
}

export function defaultCoefs(eq: EquationDef): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of [...eq.reactants, ...eq.products]) out[s.id] = 1
  return out
}
