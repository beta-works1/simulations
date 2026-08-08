import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { BELL_STAGES, nextStage, prevStage, stageAt } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'step',
    label: 'Step the cycle',
    detail: 'Use Next to walk through make–break: closed → attract → strike → break.',
  },
  {
    id: 'loop',
    label: 'See the repeat',
    detail: 'After contact breaks, the cycle returns to closed and rings again.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'An electric bell uses an electromagnet and a make–break contact (p.132).',
    'Attracting the armature rings the gong and opens the circuit; the spring resets it.',
  ],
  quiz: {
    question: 'When the make–break contact opens, the electromagnet…',
    choices: ['Gets stronger', 'Loses current and releases the armature', 'Becomes a permanent magnet'],
    correctIndex: 1,
  },
}

export function ElectricBellSim() {
  const [stageIndex, setStageIndex] = useState(0)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const stage = stageAt(stageIndex)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && stageIndex >= 2) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && stageIndex === 0 && !recapOpen) {
      /* completed a wrap — open when student hits break then next */
    }
    if (guidedStepIndex === 1 && stageIndex === 3) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, stageIndex, recapOpen, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Electric bell (p.132)">
        Step through the make–break cycle that makes the bell keep ringing.
      </ActivityCallout>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="gs8-btn" style={{ flex: 1 }} onClick={() => setStageIndex(prevStage(stageIndex))}>
          Prev
        </button>
        <button type="button" className="gs8-btn" style={{ flex: 1 }} onClick={() => setStageIndex(nextStage(stageIndex))}>
          Next
        </button>
      </div>
      <ReadoutBadge label="Stage" value={`${stageIndex + 1} / ${BELL_STAGES.length}`} />
      {(exploreMode || stageIndex === 3) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="electric-bell"
      unitId="unit-10"
      unitNumber={10}
      title="Electric Bell"
      slo={[
        'Sequence the make–break stages of an electric bell.',
        'Explain why the armature repeatedly strikes the gong.',
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
        setStageIndex(0)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#5a6b7f' }}>
          {BELL_STAGES.map((s) => (
            <li key={s.id} style={{ fontWeight: s.id === stage.id ? 700 : 400, color: s.id === stage.id ? '#152033' : undefined }}>
              {s.name}
            </li>
          ))}
        </ol>
        <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{stage.name}</p>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{stage.detail}</p>
      </div>
    </SimulationShell>
  )
}
