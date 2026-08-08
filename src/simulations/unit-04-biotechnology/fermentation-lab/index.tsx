import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { OPTIMAL_TEMP_C, bubbleScore, fermentationLabel } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'yeast',
    label: 'Add yeast',
    detail: 'Raise yeast amount (e.g. 6+) so fermentation can start.',
  },
  {
    id: 'temp',
    label: 'Warm it',
    detail: `Set temperature near ${OPTIMAL_TEMP_C} °C — not ice-cold, not boiling.`,
  },
  {
    id: 'time',
    label: 'Give time',
    detail: 'Increase time and watch the CO₂ bubble score climb, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Yeast fermentation releases CO₂ (and alcohol in some foods/drinks).',
    'Rate depends on yeast amount, suitable temperature, and enough time.',
  ],
  quiz: {
    question: 'What gas do yeast cells release during fermentation that makes dough rise?',
    choices: ['Oxygen', 'Nitrogen', 'Carbon dioxide'],
    correctIndex: 2,
  },
}

export function FermentationLabSim() {
  const [yeast, setYeast] = useState(3)
  const [temp, setTemp] = useState(20)
  const [time, setTime] = useState(15)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const score = bubbleScore(yeast, temp, time)
  const label = fermentationLabel(score)
  const bubbleCount = Math.round(score / 10)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && yeast >= 6) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && Math.abs(temp - OPTIMAL_TEMP_C) <= 5) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && time >= 40 && score >= 35) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, yeast, temp, time, score, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Fermentation lab (p.39)">
        Adjust yeast, temperature, and time. Watch the CO₂ bubble score.
      </ActivityCallout>
      <Slider label="Yeast" min={0} max={10} step={1} value={yeast} onChange={setYeast} unit=" units" />
      <Slider label="Temperature" min={5} max={50} step={1} value={temp} onChange={setTemp} unit=" °C" />
      <Slider label="Time" min={0} max={60} step={1} value={time} onChange={setTime} unit=" min" />
      <ReadoutBadge label="Bubble score" value={String(score)} />
      <ReadoutBadge label="Activity" value={label} />
      {(exploreMode || score >= 35) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="fermentation-lab"
      unitId="unit-04"
      unitNumber={4}
      title="Fermentation Lab"
      slo={[
        'Link yeast, temperature, and time to fermentation activity.',
        'Identify CO₂ as a product that can be seen as bubbles.',
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
        setYeast(3)
        setTemp(20)
        setTime(15)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center', justifyItems: 'center' }}>
        <div
          style={{
            width: 160,
            height: 200,
            borderRadius: '12px 12px 40px 40px',
            border: '4px solid #047857',
            background: 'linear-gradient(180deg,#fef3c7,#fde68a)',
            position: 'relative',
            overflow: 'hidden',
          }}
          role="img"
          aria-label={`CO₂ bubble score ${score}`}
        >
          {Array.from({ length: bubbleCount }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 20 + (i * 37) % 110,
                bottom: 16 + (i * 23) % 140,
                width: 10 + (i % 3) * 4,
                height: 10 + (i % 3) * 4,
                borderRadius: '50%',
                background: 'rgba(14,116,144,0.35)',
                border: '1px solid rgba(14,116,144,0.5)',
              }}
            />
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{label}</p>
        <p style={{ margin: 0, color: '#5a6b7f' }}>Score {score} / 100</p>
      </div>
    </SimulationShell>
  )
}
