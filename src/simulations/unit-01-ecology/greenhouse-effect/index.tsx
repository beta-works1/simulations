import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { CO2_MAX, CO2_MIN, tempGauge, temperatureFromCo2 } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'baseline',
    label: 'Baseline CO₂',
    detail: 'Set CO₂ near 280 ppm — a pre-industrial baseline — and note the temperature.',
  },
  {
    id: 'raise',
    label: 'Raise CO₂',
    detail: 'Slide CO₂ up past 420 ppm. Watch the temperature gauge climb.',
  },
  {
    id: 'link',
    label: 'Link the idea',
    detail: 'Higher CO₂ traps more heat. Open Recap when ready.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Greenhouse gases such as CO₂ trap heat in Earth’s atmosphere.',
    'Higher CO₂ levels are linked with a warmer average surface temperature.',
  ],
  quiz: {
    question: 'If atmospheric CO₂ increases a lot, average temperature tends to…',
    choices: ['Fall', 'Stay exactly the same', 'Rise'],
    correctIndex: 2,
  },
}

export function GreenhouseEffectSim() {
  const [co2, setCo2] = useState(350)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const temp = temperatureFromCo2(co2)
  const gauge = tempGauge(co2)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && co2 <= 300) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && co2 >= 420) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && co2 >= 420) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, co2, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Greenhouse effect (p.8)">
        Raise atmospheric CO₂ and watch the temperature gauge respond.
      </ActivityCallout>
      <Slider label="CO₂" min={CO2_MIN} max={CO2_MAX} step={5} value={co2} onChange={setCo2} unit=" ppm" />
      <ReadoutBadge label="Temperature" value={`${temp.toFixed(1)} °C`} />
      {(exploreMode || guidedStepIndex >= 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="greenhouse-effect"
      unitId="unit-01"
      unitNumber={1}
      title="Greenhouse Effect"
      slo={[
        'Relate rising CO₂ to an increase in average temperature.',
        'Describe the greenhouse effect in Class-8 language.',
      ]}
      bookPage={8}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setCo2(350)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', justifyItems: 'center', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>Temperature gauge</p>
        <div
          style={{
            width: 64,
            height: 180,
            borderRadius: 32,
            border: '4px solid #334155',
            background: '#e2e8f0',
            position: 'relative',
            overflow: 'hidden',
          }}
          role="img"
          aria-label={`Temperature ${temp.toFixed(1)} degrees Celsius`}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${20 + gauge * 80}%`,
              background: 'linear-gradient(180deg,#f97316,#ef4444)',
              transition: 'height 0.3s ease',
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{temp.toFixed(1)} °C</p>
        <p style={{ margin: 0, color: '#5a6b7f' }}>CO₂ {co2} ppm</p>
      </div>
    </SimulationShell>
  )
}
