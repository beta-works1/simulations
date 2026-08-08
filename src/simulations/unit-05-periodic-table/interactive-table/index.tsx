import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { ELEMENTS, elementByZ, type ElementData } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'pick',
    label: 'Pick an element',
    detail: 'Tap any cell (try Sodium, Na) to open the detail panel.',
  },
  {
    id: 'read',
    label: 'Read the card',
    detail: 'Check Z, mass, electron configuration, and physical state.',
  },
  {
    id: 'compare',
    label: 'Compare a noble gas',
    detail: 'Open Neon or Argon — notice the full outer shell (8).',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Atomic number Z is the number of protons; it orders the periodic table.',
    'Electron configuration shows shells (e.g. Na: 2, 8, 1).',
  ],
  quiz: {
    question: 'What is the electron configuration of sodium (Na)?',
    choices: ['2, 8, 1', '2, 8, 2', '2, 8, 8'],
    correctIndex: 0,
  },
}

const STATE_COLOR: Record<ElementData['state'], string> = {
  gas: '#bae6fd',
  liquid: '#a5f3fc',
  solid: '#99f6e4',
}

export function InteractivePeriodicTableSim() {
  const [selectedZ, setSelectedZ] = useState<number | null>(null)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()

  const selected = selectedZ != null ? elementByZ(selectedZ) : undefined

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && selectedZ != null) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && selectedZ != null) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && (selectedZ === 10 || selectedZ === 18)) {
      setRecapOpen(true)
    }
  }, [exploreMode, guidedStepIndex, selectedZ, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Interactive table (p.46)">
        Tap a cell for symbol, Z, mass, configuration, and state.
      </ActivityCallout>
      {selected ? (
        <>
          <ReadoutBadge label="Element" value={`${selected.name} (${selected.symbol})`} />
          <ReadoutBadge label="Z" value={String(selected.Z)} />
          <ReadoutBadge label="Mass (approx)" value={String(selected.mass)} />
          <ReadoutBadge label="Config" value={selected.config} />
          <ReadoutBadge label="State" value={selected.state} />
        </>
      ) : (
        <p style={{ fontSize: 13, color: '#5a6b7f' }}>No element selected yet.</p>
      )}
      {(exploreMode || recapOpen || selectedZ === 10 || selectedZ === 18) && (
        <button
          type="button"
          className="gs8-btn"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => setRecapOpen(true)}
        >
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="interactive-table"
      unitId="unit-05"
      unitNumber={5}
      title="Interactive Periodic Table"
      slo={[
        'Locate the first 18 elements (H→Ar) on a simplified periodic grid.',
        'Read atomic number, mass, electron configuration, and state from a detail card.',
      ]}
      bookPage={46}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setSelectedZ(null)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1rem', height: '100%', display: 'grid', gap: '1rem', gridTemplateRows: '1fr auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            gap: 4,
            alignContent: 'start',
          }}
          role="grid"
          aria-label="Periodic table first 18 elements"
        >
          {ELEMENTS.map((el) => {
            const col = el.group
            const row = el.period
            return (
              <button
                key={el.Z}
                type="button"
                role="gridcell"
                aria-pressed={selectedZ === el.Z}
                onClick={() => setSelectedZ(el.Z)}
                style={{
                  gridColumn: col,
                  gridRow: row,
                  minHeight: 52,
                  borderRadius: 6,
                  border: selectedZ === el.Z ? '2px solid #0f766e' : '1px solid #94a3b8',
                  background: STATE_COLOR[el.state],
                  cursor: 'pointer',
                  padding: 4,
                  font: 'inherit',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 9, color: '#475569' }}>{el.Z}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{el.symbol}</div>
              </button>
            )
          })}
        </div>

        <aside
          style={{
            borderRadius: 12,
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            padding: '0.85rem 1rem',
            minHeight: 88,
          }}
          aria-live="polite"
        >
          {selected ? (
            <>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {selected.name} ({selected.symbol})
              </p>
              <p style={{ margin: '0.35rem 0 0', color: '#115e59' }}>
                Z = {selected.Z} · mass ≈ {selected.mass} · {selected.config} · {selected.state}
              </p>
            </>
          ) : (
            <p style={{ margin: 0, color: '#5a6b7f' }}>Click a grid cell to see details.</p>
          )}
        </aside>
      </div>
    </SimulationShell>
  )
}
