import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, StepperScrubber } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { PIPELINE_STEPS, clampPipeline, pipelineAt } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'donor',
    label: 'Donor gene',
    detail: 'Start at the donor gene — the useful DNA we want to copy.',
  },
  {
    id: 'recombinant',
    label: 'Recombinant DNA',
    detail: 'Step to recombinant DNA — donor gene joined into a plasmid.',
  },
  {
    id: 'protein',
    label: 'Useful protein',
    detail: 'Finish at protein production in the host bacterium, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Genetic engineering moves a useful gene into a host (often a bacterium) to make a product.',
    'Pipeline: donor gene → open plasmid → recombinant DNA → host bacterium → protein.',
  ],
  quiz: {
    question: 'Recombinant DNA is formed when…',
    choices: [
      'A gene is joined into a plasmid',
      'Only the donor cell divides',
      'Temperature rises in fermentation',
    ],
    correctIndex: 0,
  },
}

export function GeneticEngineeringPipelineSim() {
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const step = pipelineAt(stepIndex)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setStepIndex((i) => {
        if (i >= PIPELINE_STEPS.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, 900)
    return () => window.clearInterval(id)
  }, [playing])

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && stepIndex === 0) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && stepIndex === 2) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && stepIndex === 4) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, stepIndex, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Genetic engineering (p.39)">
        Step through donor → plasmid → recombinant → bacterium → protein.
      </ActivityCallout>
      <StepperScrubber
        stageIndex={stepIndex}
        stageLabels={PIPELINE_STEPS.map((s) => s.label)}
        playing={playing}
        onPlayPause={() => setPlaying((p) => !p)}
        onStep={(dir) => setStepIndex((i) => clampPipeline(i + dir))}
        onSelect={setStepIndex}
      />
      <ReadoutBadge label="Step" value={`${stepIndex + 1} / ${PIPELINE_STEPS.length}`} />
      {(exploreMode || stepIndex === 4) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="genetic-engineering-pipeline"
      unitId="unit-04"
      unitNumber={4}
      title="Genetic Engineering Pipeline"
      slo={[
        'Sequence the main steps of making recombinant DNA for a useful product.',
        'Explain the role of a plasmid and a host bacterium.',
      ]}
      bookPage={39}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setStepIndex(0)
        setPlaying(false)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '0.75rem', alignContent: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {PIPELINE_STEPS.map((s, i) => {
            const on = i === stepIndex
            return (
              <div
                key={s.id}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 10,
                  border: `2px solid ${on ? '#059669' : i < stepIndex ? '#6ee7b7' : '#cbd5e1'}`,
                  background: on ? '#d1fae5' : '#f8fafc',
                  fontWeight: on ? 700 : 500,
                  color: on ? '#065f46' : '#475569',
                  fontSize: 13,
                }}
              >
                {i + 1}. {s.label}
              </div>
            )
          })}
        </div>
        <div
          style={{
            maxWidth: 420,
            margin: '0.5rem auto 0',
            padding: '1rem',
            borderRadius: 12,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: '#065f46' }}>{step.label}</p>
          <p style={{ margin: '0.35rem 0 0', color: '#334155' }}>{step.detail}</p>
        </div>
      </div>
    </SimulationShell>
  )
}
