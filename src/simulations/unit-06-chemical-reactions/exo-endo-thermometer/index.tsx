import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { thermometerFor, type ReactionKind } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'exo',
    label: 'Exothermic',
    detail: 'Choose CaO + H₂O. The thermometer reading rises as heat is released.',
  },
  {
    id: 'endo',
    label: 'Endothermic',
    detail: 'Switch to the endothermic example. Temperature falls as heat is absorbed.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Exothermic reactions release heat — surroundings get warmer (p.67).',
    'Endothermic reactions absorb heat — temperature of the mixture falls.',
  ],
  quiz: {
    question: 'When quicklime (CaO) reacts with water, the mixture usually…',
    choices: ['Cools down', 'Heats up', 'Stays exactly 0 °C'],
    correctIndex: 1,
  },
}

export function ExoEndoThermometerSim() {
  const [kind, setKind] = useState<ReactionKind>('exo')
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const state = thermometerFor(kind)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && kind === 'exo') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && kind === 'endo') setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, kind, setGuidedStepIndex, setRecapOpen])

  const fillPct = ((state.endTempC - 0) / 60) * 100

  const controls = (
    <>
      <ActivityCallout title="Heat in reactions (p.67)">
        Pick exothermic (CaO + H₂O) or endothermic and watch the thermometer.
      </ActivityCallout>
      <fieldset style={{ border: 'none', padding: 0, margin: '0.5rem 0' }}>
        <legend style={{ fontSize: 13, marginBottom: 6 }}>Reaction</legend>
        <label className="gs8-check">
          <input type="radio" name="kind" checked={kind === 'exo'} onChange={() => setKind('exo')} />
          <span>Exothermic — CaO + H₂O</span>
        </label>
        <label className="gs8-check">
          <input type="radio" name="kind" checked={kind === 'endo'} onChange={() => setKind('endo')} />
          <span>Endothermic — NH₄Cl dissolving</span>
        </label>
      </fieldset>
      <ReadoutBadge label="Temperature" value={`${state.endTempC} °C`} />
      <ReadoutBadge label="Change" value={state.direction === 'rises' ? 'Rises' : 'Falls'} />
      {(exploreMode || kind === 'endo') && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="exo-endo-thermometer"
      unitId="unit-06"
      unitNumber={6}
      title="Exo / Endo Thermometer"
      slo={[
        'Distinguish exothermic and endothermic reactions by temperature change.',
        'Recall CaO + H₂O as a heat-releasing example.',
      ]}
      bookPage={67}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setKind('exo')
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>{state.label}</p>
        <p style={{ margin: 0, color: '#5a6b7f' }}>{state.equation}</p>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div
            style={{
              width: 36,
              height: 180,
              borderRadius: 18,
              border: '3px solid #64748b',
              background: '#e2e8f0',
              position: 'relative',
              overflow: 'hidden',
            }}
            role="img"
            aria-label={`Thermometer ${state.endTempC} degrees`}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${Math.min(100, Math.max(8, fillPct))}%`,
                background: state.direction === 'rises' ? '#ef4444' : '#38bdf8',
                transition: 'height 0.35s ease, background 0.25s',
              }}
            />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{state.endTempC} °C</p>
            <p style={{ margin: '0.35rem 0 0', color: '#5a6b7f' }}>
              From {state.startTempC} °C — temperature {state.direction}
            </p>
          </div>
        </div>
      </div>
    </SimulationShell>
  )
}
