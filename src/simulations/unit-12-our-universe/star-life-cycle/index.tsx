import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { lifePathSummary, remnantForMass, stageForMass } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'sunlike',
    label: 'Sun-like mass',
    detail: 'Set mass near 1 M☉. The end stage should be a white dwarf (WD).',
  },
  {
    id: 'high',
    label: 'High mass',
    detail: 'Raise mass above 8 M☉. End stage becomes neutron star (NS) or black hole (BH).',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'A star’s mass decides its life path and final remnant (p.151).',
    'Lower mass → white dwarf (WD); very high mass → neutron star (NS) or black hole (BH).',
  ],
  quiz: {
    question: 'A star much heavier than the Sun is most likely to end as…',
    choices: ['Only a white dwarf', 'A neutron star or black hole', 'A planet'],
    correctIndex: 1,
  },
}

export function StarLifeCycleSim() {
  const [mass, setMass] = useState(1)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()

  const stage = stageForMass(mass)
  const remnant = remnantForMass(mass)
  const path = lifePathSummary(mass)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && remnant === 'WD') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && (remnant === 'NS' || remnant === 'BH')) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, remnant, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Star life cycle (p.151)">
        Change the star’s mass (solar masses). Watch whether the remnant is WD, NS, or BH.
      </ActivityCallout>
      <Slider label="Mass" min={0.5} max={40} step={0.5} value={mass} onChange={setMass} unit=" M☉" />
      <ReadoutBadge label="Stage" value={stage} />
      <ReadoutBadge label="Remnant" value={remnant} />
      {(exploreMode || remnant === 'NS' || remnant === 'BH') && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="star-life-cycle"
      unitId="unit-12"
      unitNumber={12}
      title="Star Life Cycle"
      slo={[
        'Link stellar mass to life stages and remnants.',
        'Distinguish white dwarf, neutron star, and black hole endings.',
      ]}
      bookPage={151}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setMass(1)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{stage}</p>
        <p style={{ margin: 0, color: '#5a6b7f' }}>{path}</p>
        <div
          style={{
            width: 120 + mass * 3,
            height: 120 + mass * 3,
            maxWidth: 280,
            maxHeight: 280,
            borderRadius: '50%',
            background:
              remnant === 'BH'
                ? 'radial-gradient(circle at 40% 35%, #334155, #0f172a 70%)'
                : remnant === 'NS'
                  ? 'radial-gradient(circle at 40% 35%, #e0f2fe, #0369a1)'
                  : 'radial-gradient(circle at 40% 35%, #fef9c3, #f59e0b)',
            boxShadow: remnant === 'BH' ? '0 0 0 12px rgba(15,23,42,0.35)' : '0 8px 24px rgba(15,23,42,0.15)',
            transition: 'width 0.2s, height 0.2s, background 0.25s',
          }}
          role="img"
          aria-label={`${mass} solar masses, ${stage}`}
        />
      </div>
    </SimulationShell>
  )
}
