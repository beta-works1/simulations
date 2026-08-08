import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, StepperScrubber } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { MITOSIS_STAGES, clampStage, stageAt } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'start',
    label: 'Interphase',
    detail: 'Begin at interphase — DNA is copied before chromosomes appear condensed.',
  },
  {
    id: 'meta',
    label: 'Metaphase',
    detail: 'Step to metaphase — chromosomes line up at the equator.',
  },
  {
    id: 'end',
    label: 'Telophase',
    detail: 'Reach telophase, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Mitosis produces two nuclei with the same chromosome number as the parent cell.',
    'Order: interphase → prophase → metaphase → anaphase → telophase (then cytokinesis).',
  ],
  quiz: {
    question: 'At which stage do chromosomes line up at the cell equator?',
    choices: ['Prophase', 'Metaphase', 'Anaphase'],
    correctIndex: 1,
  },
}

export function MitosisStepperSim() {
  const [stageIndex, setStageIndex] = useState(0)
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

  const stage = stageAt(stageIndex)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setStageIndex((i) => {
        if (i >= MITOSIS_STAGES.length - 1) {
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
    if (guidedStepIndex === 0 && stageIndex === 0) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && stageIndex === 2) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && stageIndex === 4) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, stageIndex, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Mitosis stages (p.30)">
        Step through interphase to telophase and watch what happens to the chromosomes.
      </ActivityCallout>
      <StepperScrubber
        stageIndex={stageIndex}
        stageLabels={MITOSIS_STAGES.map((s) => s.label)}
        playing={playing}
        onPlayPause={() => setPlaying((p) => !p)}
        onStep={(dir) => setStageIndex((i) => clampStage(i + dir))}
        onSelect={setStageIndex}
      />
      <ReadoutBadge label="Stage" value={stage.label} />
      {(exploreMode || stageIndex === 4) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="mitosis-stepper"
      unitId="unit-03"
      unitNumber={3}
      title="Mitosis Stepper"
      slo={[
        'Name the stages of mitosis in order.',
        'Describe what chromosomes do at metaphase and anaphase.',
      ]}
      bookPage={30}
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
        setPlaying(false)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center', justifyItems: 'center' }}>
        <div
          style={{
            width: 220,
            height: 160,
            borderRadius: '50%',
            border: '4px solid #0891b2',
            background: '#cffafe',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
          }}
          role="img"
          aria-label={stage.label}
        >
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#155e75' }}>{stage.label}</span>
          <div style={{ position: 'absolute', inset: 28, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
            {Array.from({ length: stageIndex >= 3 ? 4 : 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: stageIndex === 0 ? 28 : 40,
                  borderRadius: 4,
                  background: '#0e7490',
                  transform:
                    stageIndex === 2
                      ? 'translateY(0)'
                      : stageIndex >= 3
                        ? `translateX(${i < 2 ? -18 : 18}px)`
                        : undefined,
                  transition: 'transform 0.35s ease',
                }}
              />
            ))}
          </div>
        </div>
        <p style={{ margin: 0, maxWidth: 360, textAlign: 'center', color: '#334155' }}>{stage.detail}</p>
      </div>
    </SimulationShell>
  )
}
