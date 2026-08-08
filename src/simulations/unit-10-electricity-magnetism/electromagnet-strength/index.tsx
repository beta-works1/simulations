import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { electromagnetStrength } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'turns',
    label: 'Add turns',
    detail: 'Increase the number of coil turns and watch paperclips rise.',
  },
  {
    id: 'current',
    label: 'Raise current',
    detail: 'Increase current (amperes). Strength grows with both turns and current.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'An electromagnet’s strength increases with more turns of wire.',
    'Greater current in the coil also lifts more paperclips.',
  ],
  quiz: {
    question: 'With more turns and the same current, an electromagnet usually…',
    choices: ['Gets weaker', 'Gets stronger', 'Does not change'],
    correctIndex: 1,
  },
}

export function ElectromagnetStrengthSim() {
  const [turns, setTurns] = useState(10)
  const [current, setCurrent] = useState(1)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const state = electromagnetStrength(turns, current)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && turns > 10) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && current > 1) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, turns, current, setGuidedStepIndex, setRecapOpen])

  const clips = Array.from({ length: Math.min(state.paperclips, 40) }, (_, i) => i)

  const controls = (
    <>
      <ActivityCallout title="Electromagnet strength (p.132)">
        More turns and more current → stronger magnet (more paperclips).
      </ActivityCallout>
      <Slider label="Turns" min={1} max={50} step={1} value={turns} onChange={setTurns} />
      <Slider
        label="Current"
        min={0}
        max={5}
        step={0.1}
        value={current}
        unit=" A"
        onChange={setCurrent}
      />
      <ReadoutBadge label="Paperclips lifted" value={String(state.paperclips)} />
      {(exploreMode || current > 1) && (
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
      simId="electromagnet-strength"
      unitId="unit-10"
      unitNumber={10}
      title="Electromagnet Strength Lab"
      slo={[
        'Relate coil turns and current to electromagnet strength.',
        'Predict how many paperclips a coil can lift from a simple model.',
      ]}
      bookPage={132}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setTurns(10)
        setCurrent(1)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <svg viewBox="0 0 360 200" width="100%" height="200" role="img" aria-label="Electromagnet coil">
          <rect x="0" y="0" width="360" height="200" fill="#f8fafc" />
          {/* Iron core */}
          <rect x="140" y="40" width="40" height="120" rx="6" fill="#64748b" />
          {/* Coil loops */}
          {Array.from({ length: Math.min(turns, 24) }, (_, i) => {
            const y = 50 + i * (100 / Math.min(turns, 24))
            return (
              <ellipse
                key={i}
                cx="160"
                cy={y}
                rx="48"
                ry="6"
                fill="none"
                stroke="#ea580c"
                strokeWidth="2"
              />
            )
          })}
          <text x="210" y="100" fontSize="13" fill="#9a3412">
            {turns} turns · {current.toFixed(1)} A
          </text>
        </svg>
        <div>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>
            Paperclips lifted: {state.paperclips}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} aria-hidden>
            {clips.map((i) => (
              <span
                key={i}
                style={{
                  width: 14,
                  height: 28,
                  borderRadius: 3,
                  background: 'linear-gradient(180deg,#cbd5e1,#64748b)',
                  border: '1px solid #475569',
                  display: 'inline-block',
                }}
              />
            ))}
            {state.paperclips === 0 && (
              <span style={{ color: '#64748b', fontSize: 13 }}>None yet — raise turns or current.</span>
            )}
          </div>
        </div>
      </div>
    </SimulationShell>
  )
}
