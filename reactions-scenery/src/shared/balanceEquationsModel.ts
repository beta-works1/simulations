export interface MoleculeSpec {
  id: string
  label: string
  atoms: Record<string, number>
  color: string
}

export interface EquationSpec {
  id: string
  label: string
  reactants: MoleculeSpec[]
  products: MoleculeSpec[]
  /** Balanced coefficient targets keyed by molecule id. */
  balanced: Record<string, number>
}

export const EQUATIONS: EquationSpec[] = [
  {
    id: 'h2o',
    label: 'H₂ + O₂ → H₂O',
    reactants: [
      { id: 'H2', label: 'H₂', atoms: { H: 2 }, color: '#3498db' },
      { id: 'O2', label: 'O₂', atoms: { O: 2 }, color: '#e74c3c' },
    ],
    products: [{ id: 'H2O', label: 'H₂O', atoms: { H: 2, O: 1 }, color: '#9b59b6' }],
    balanced: { H2: 2, O2: 1, H2O: 2 },
  },
  {
    id: 'nh3',
    label: 'N₂ + H₂ → NH₃',
    reactants: [
      { id: 'N2', label: 'N₂', atoms: { N: 2 }, color: '#2980b9' },
      { id: 'H2', label: 'H₂', atoms: { H: 2 }, color: '#3498db' },
    ],
    products: [{ id: 'NH3', label: 'NH₃', atoms: { N: 1, H: 3 }, color: '#27ae60' }],
    balanced: { N2: 1, H2: 3, NH3: 2 },
  },
  {
    id: 'fe2o3',
    label: 'Fe + O₂ → Fe₂O₃',
    reactants: [
      { id: 'Fe', label: 'Fe', atoms: { Fe: 1 }, color: '#7f8c8d' },
      { id: 'O2', label: 'O₂', atoms: { O: 2 }, color: '#e74c3c' },
    ],
    products: [{ id: 'Fe2O3', label: 'Fe₂O₃', atoms: { Fe: 2, O: 3 }, color: '#c0392b' }],
    balanced: { Fe: 4, O2: 3, Fe2O3: 2 },
  },
  {
    id: 'combustion',
    label: 'CH₄ + O₂ → CO₂ + H₂O',
    reactants: [
      { id: 'CH4', label: 'CH₄', atoms: { C: 1, H: 4 }, color: '#2c3e50' },
      { id: 'O2', label: 'O₂', atoms: { O: 2 }, color: '#e74c3c' },
    ],
    products: [
      { id: 'CO2', label: 'CO₂', atoms: { C: 1, O: 2 }, color: '#95a5a6' },
      { id: 'H2O', label: 'H₂O', atoms: { H: 2, O: 1 }, color: '#3498db' },
    ],
    balanced: { CH4: 1, O2: 2, CO2: 1, H2O: 2 },
  },
]

export function defaultCoefficients(eq: EquationSpec): Record<string, number> {
  const c: Record<string, number> = {}
  for (const m of [...eq.reactants, ...eq.products]) c[m.id] = 1
  return c
}

export function countAtoms(
  molecules: MoleculeSpec[],
  coefficients: Record<string, number>,
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const m of molecules) {
    const coef = coefficients[m.id] ?? 1
    for (const [atom, n] of Object.entries(m.atoms)) {
      totals[atom] = (totals[atom] ?? 0) + n * coef
    }
  }
  return totals
}

export function isBalanced(eq: EquationSpec, coefficients: Record<string, number>): boolean {
  const left = countAtoms(eq.reactants, coefficients)
  const right = countAtoms(eq.products, coefficients)
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const k of keys) {
    if ((left[k] ?? 0) !== (right[k] ?? 0)) return false
  }
  return true
}

export function formatAtomCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([atom, n]) => `${atom}: ${n}`)
    .join('  ·  ')
}

export function formatEquation(eq: EquationSpec, coefficients: Record<string, number>): string {
  const side = (mols: MoleculeSpec[]) =>
    mols
      .map((m) => {
        const c = coefficients[m.id] ?? 1
        return c > 1 ? `${c}${m.label}` : m.label
      })
      .join(' + ')
  return `${side(eq.reactants)} → ${side(eq.products)}`
}
