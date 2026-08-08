import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useLocalizedRecap } from '../../../i18n/useLocalizedRecap'
import {
  EQUATIONS,
  defaultCoefs,
  elementStatus,
  isFullyBalanced,
  type EquationDef,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'scan',
    label: 'Scan atoms',
    detail: 'Look at the atom table — which elements are already balanced?',
  },
  {
    id: 'fix-cl',
    label: 'Balance Cl / Na',
    detail: 'Raise NaCl to 2 so chlorine (and sodium) match on both sides.',
  },
  {
    id: 'check',
    label: 'Check all',
    detail: 'When every row shows Balanced, open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Law of Conservation of Mass: atoms are neither created nor destroyed in a chemical reaction (p.63).',
    'A balanced equation has the same number of each atom on both sides.',
  ],
  quiz: {
    question: 'In CaCl₂ + Na₂CO₃ → CaCO₃ + NaCl, what coefficient belongs in front of NaCl?',
    choices: ['1', '2', '3'],
    correctIndex: 1,
  },
}

function CoefStepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 4px' }}>
      <button
        type="button"
        className="gs8-icon-btn"
        style={{ minWidth: 36, minHeight: 36, background: '#e2e8f0', color: '#152033' }}
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <strong aria-live="polite">{value}</strong>
      <span>{label}</span>
      <button
        type="button"
        className="gs8-icon-btn"
        style={{ minWidth: 36, minHeight: 36, background: '#e2e8f0', color: '#152033' }}
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(8, value + 1))}
      >
        +
      </button>
    </div>
  )
}

export function EquationBalancerSim() {
  const [eqIndex, setEqIndex] = useState(0)
  const eq: EquationDef = EQUATIONS[eqIndex]
  const [coefs, setCoefs] = useState(() => defaultCoefs(eq))
  const [guidedStepIndex, setGuidedStepIndex] = useState(0)
  const [exploreMode, setExploreMode] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const recap = useLocalizedRecap('equation-balancer', RECAP)

  const rows = elementStatus(eq.reactants, eq.products, coefs)
  const balanced = isFullyBalanced(eq.reactants, eq.products, coefs)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0) setGuidedStepIndex(1)
  }, [exploreMode, guidedStepIndex])

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 1 && (coefs.NaCl ?? 1) >= 2) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && balanced) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, coefs, balanced])

  const setCoef = (id: string, v: number) => setCoefs((c) => ({ ...c, [id]: v }))

  const loadEq = (i: number) => {
    setEqIndex(i)
    setCoefs(defaultCoefs(EQUATIONS[i]))
  }

  const controls = (
    <>
      <ActivityCallout title="Activity 6.3">
        Balance one element at a time. The atom table updates live — green means that element matches.
      </ActivityCallout>
      {exploreMode ? (
        <label style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>Equation bank</span>
          <select
            value={eqIndex}
            onChange={(e) => loadEq(Number(e.target.value))}
            style={{ minHeight: 44, borderRadius: 8, padding: '0 8px' }}
          >
            {EQUATIONS.map((e, i) => (
              <option key={e.id} value={i}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <ReadoutBadge label="Status" value={balanced ? 'Balanced ✓' : 'Unbalanced'} />
      {(exploreMode || balanced) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="equation-balancer"
      unitId="unit-06"
      unitNumber={6}
      title="Chemical Equation Balancer"
      slo={[
        'Balance chemical equations by adjusting coefficients (Activity 6.3, p.63).',
        'Connect balancing to the Law of Conservation of Mass.',
      ]}
      bookPage={63}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={(v) => {
        setExploreMode(v)
        if (v) setEqIndex(0)
      }}
      recap={recap}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        loadEq(0)
        setGuidedStepIndex(0)
        setExploreMode(false)
        setRecapOpen(false)
      }}
      controls={controls}
    >
      <div style={{ padding: '1rem 1.25rem', overflow: 'auto', height: '100%' }}>
        <p style={{ marginTop: 0, color: '#5a6b7f' }}>{eq.label}</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            marginBottom: '1rem',
            fontSize: '1.15rem',
          }}
        >
          {eq.reactants.map((s, i) => (
            <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {i > 0 ? <span style={{ margin: '0 6px' }}>+</span> : null}
              <CoefStepper label={s.label} value={coefs[s.id] ?? 1} onChange={(v) => setCoef(s.id, v)} />
            </span>
          ))}
          <span style={{ margin: '0 8px', fontWeight: 700 }}>→</span>
          {eq.products.map((s, i) => (
            <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {i > 0 ? <span style={{ margin: '0 6px' }}>+</span> : null}
              <CoefStepper label={s.label} value={coefs[s.id] ?? 1} onChange={(v) => setCoef(s.id, v)} />
            </span>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: 8 }}>Element</th>
              <th style={{ padding: 8 }}>Reactants</th>
              <th style={{ padding: 8 }}>Products</th>
              <th style={{ padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.element} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 8, fontWeight: 700 }}>{row.element}</td>
                <td style={{ padding: 8 }}>{row.left}</td>
                <td style={{ padding: 8 }}>{row.right}</td>
                <td style={{ padding: 8, color: row.balanced ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                  {row.balanced ? 'Balanced ✓' : 'Unbalanced'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SimulationShell>
  )
}
