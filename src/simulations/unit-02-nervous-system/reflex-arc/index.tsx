import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import {
  PATHWAY_STEPS,
  STIMULI,
  nextHighlight,
  responseFor,
  type StimulusId,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'stimulus',
    label: 'Apply a stimulus',
    detail: 'Press Hot object (or another stimulus) to start the reflex pathway.',
  },
  {
    id: 'trace',
    label: 'Trace the path',
    detail: 'Step through Receptor → Sensory → Spinal cord → Motor → Effector.',
  },
  {
    id: 'response',
    label: 'See the response',
    detail: 'When the effector lights up, note the protective response and open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'A reflex arc is a rapid pathway: receptor → sensory neuron → spinal cord → motor neuron → effector.',
    'Reflexes protect the body without waiting for conscious thought in the brain.',
  ],
  quiz: {
    question: 'After the sensory neuron, the next stop in a spinal reflex is usually the…',
    choices: ['Brain cortex only', 'Spinal cord', 'Skin receptor again'],
    correctIndex: 1,
  },
}

export function ReflexArcSim() {
  const [stimulus, setStimulus] = useState<StimulusId | null>(null)
  const [highlight, setHighlight] = useState(-1)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && stimulus) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && highlight >= 2) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && highlight >= PATHWAY_STEPS.length - 1) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, stimulus, highlight, setGuidedStepIndex, setRecapOpen])

  const fire = (id: StimulusId) => {
    setStimulus(id)
    setHighlight(0)
  }

  const step = () => {
    if (!stimulus) return
    setHighlight((h) => nextHighlight(h))
  }

  const controls = (
    <>
      <ActivityCallout title="Reflex arc (p.20)">
        Choose a stimulus, then step along the pathway highlights.
      </ActivityCallout>
      <div style={{ display: 'grid', gap: 8 }}>
        {STIMULI.map((s) => (
          <button
            key={s.id}
            type="button"
            className="gs8-btn"
            style={{
              width: '100%',
              background: stimulus === s.id ? '#c026d3' : undefined,
            }}
            onClick={() => fire(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={step} disabled={!stimulus}>
        Next pathway step
      </button>
      <ReadoutBadge
        label="Response"
        value={stimulus ? responseFor(stimulus) : '—'}
      />
      {(exploreMode || highlight >= PATHWAY_STEPS.length - 1) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="reflex-arc"
      unitId="unit-02"
      unitNumber={2}
      title="Reflex Arc"
      slo={[
        'Sequence the parts of a simple reflex arc.',
        'Connect a stimulus to a protective effector response.',
      ]}
      bookPage={20}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setStimulus(null)
        setHighlight(-1)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '0.75rem', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>Pathway</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {PATHWAY_STEPS.map((stepDef, i) => {
            const on = i === highlight
            const done = i < highlight
            return (
              <div
                key={stepDef.id}
                style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: 10,
                  border: `2px solid ${on ? '#c026d3' : done ? '#d8b4fe' : '#cbd5e1'}`,
                  background: on ? '#fae8ff' : '#f8fafc',
                  fontWeight: on ? 700 : 500,
                  color: on ? '#86198f' : '#475569',
                  boxShadow: on ? '0 0 0 3px rgba(192,38,211,0.25)' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >
                {i + 1}. {stepDef.label}
              </div>
            )
          })}
        </div>
        {stimulus && (
          <p style={{ margin: '0.5rem 0 0', textAlign: 'center', fontWeight: 600 }}>
            {STIMULI.find((s) => s.id === stimulus)?.label}: {responseFor(stimulus)}
          </p>
        )}
      </div>
    </SimulationShell>
  )
}
