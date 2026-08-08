import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { bondingFor, type BondMode } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'ionic',
    label: 'Ionic NaCl',
    detail: 'Leave ionic selected and read about electron transfer.',
  },
  {
    id: 'covalent',
    label: 'Covalent H₂',
    detail: 'Toggle to covalent bonding and compare electron sharing.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Ionic bonds form by electron transfer (e.g. NaCl) (p.73).',
    'Covalent bonds form when atoms share electrons (e.g. H₂).',
  ],
  quiz: {
    question: 'In NaCl, sodium and chlorine mainly…',
    choices: ['Share a pair of electrons', 'Transfer an electron', 'Fuse nuclei'],
    correctIndex: 1,
  },
}

export function BondingBuilderSim() {
  const [mode, setMode] = useState<BondMode>('ionic')
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const state = bondingFor(mode)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && mode === 'ionic') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && mode === 'covalent') setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, mode, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Chemical bonding (p.73)">
        Toggle ionic (NaCl) vs covalent (H₂) and compare electron transfer vs sharing.
      </ActivityCallout>
      <ToggleSwitch
        label={mode === 'ionic' ? 'Ionic (NaCl)' : 'Covalent (H₂)'}
        checked={mode === 'covalent'}
        onChange={(v) => setMode(v ? 'covalent' : 'ionic')}
      />
      <ReadoutBadge label="Bond" value={state.bondLabel} />
      {(exploreMode || mode === 'covalent') && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="bonding-builder"
      unitId="unit-06"
      unitNumber={6}
      title="Bonding Builder"
      slo={[
        'Contrast ionic and covalent bonding with simple examples.',
        'Explain electron transfer versus electron sharing.',
      ]}
      bookPage={73}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setMode('ionic')
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{state.example}</p>
        <p style={{ margin: 0, fontSize: '1.1rem' }}>{state.bondLabel}</p>
        <p
          style={{
            margin: 0,
            padding: '1rem',
            background: mode === 'ionic' ? '#fef3c7' : '#e0f2fe',
            borderRadius: 12,
            lineHeight: 1.5,
          }}
        >
          {state.electronStory}
        </p>
      </div>
    </SimulationShell>
  )
}
