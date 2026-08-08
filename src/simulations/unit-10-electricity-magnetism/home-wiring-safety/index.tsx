import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { wiringSafety } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'overload',
    label: 'Overload',
    detail: 'Turn on overload with the fuse intact — the fuse should protect.',
  },
  {
    id: 'nofuse',
    label: 'No fuse',
    detail: 'Remove fuse protection while overloaded — fire risk becomes true.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Too many appliances can overload a circuit (p.129).',
    'A fuse (or breaker) melts/opens to cut current and reduce fire risk.',
  ],
  quiz: {
    question: 'An overloaded circuit with no working fuse is dangerous because…',
    choices: ['Voltage doubles safely', 'Wires can overheat and start a fire', 'Current falls to zero always'],
    correctIndex: 1,
  },
}

export function HomeWiringSafetySim() {
  const [overloaded, setOverloaded] = useState(false)
  const [fuseIntact, setFuseIntact] = useState(true)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const state = wiringSafety(overloaded, fuseIntact)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && overloaded && fuseIntact) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && state.fireRisk) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, overloaded, fuseIntact, state.fireRisk, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Home wiring safety (p.129)">
        Toggle overload and fuse. Fire risk is true only when overloaded without a fuse.
      </ActivityCallout>
      <ToggleSwitch label="Circuit overloaded" checked={overloaded} onChange={setOverloaded} />
      <ToggleSwitch label="Fuse intact / protecting" checked={fuseIntact} onChange={setFuseIntact} />
      <ReadoutBadge label="Fire risk" value={state.fireRisk ? 'YES' : 'No'} />
      {(exploreMode || state.fireRisk) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="home-wiring-safety"
      unitId="unit-10"
      unitNumber={10}
      title="Home Wiring Safety"
      slo={[
        'Explain why overloading a circuit is dangerous.',
        'Describe how a fuse protects against fire risk.',
      ]}
      bookPage={129}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setOverloaded(false)
        setFuseIntact(true)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 12,
            background: state.fireRisk ? '#fee2e2' : overloaded ? '#fef3c7' : '#dcfce7',
            border: `2px solid ${state.fireRisk ? '#ef4444' : overloaded ? '#f59e0b' : '#22c55e'}`,
          }}
        >
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
            Fire risk: {state.fireRisk ? 'TRUE' : 'false'}
          </p>
          <p style={{ margin: '0.75rem 0 0', lineHeight: 1.5 }}>{state.status}</p>
        </div>
      </div>
    </SimulationShell>
  )
}
