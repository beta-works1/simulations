import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { TROPHIC_LEVELS, energyAtLevel, energyBars } from './model'

const LEVEL_LABELS = ['Producers', 'Primary consumers', 'Secondary consumers', 'Tertiary consumers']

const GUIDED: GuidedStep[] = [
  {
    id: 'producers',
    label: 'Set producers',
    detail: 'Raise producer energy to 1000 units and look at the bottom bar.',
  },
  {
    id: 'ten-percent',
    label: '10% rule',
    detail: 'Compare levels — each step up keeps about 10% of the energy below.',
  },
  {
    id: 'shape',
    label: 'Pyramid shape',
    detail: 'Notice bars shrink upward. Open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'An ecological energy pyramid is widest at producers and narrows upward.',
    'Only about 10% of energy passes from one trophic level to the next.',
  ],
  quiz: {
    question: 'If producers have 1000 units of energy, primary consumers have about…',
    choices: ['1000', '100', '10'],
    correctIndex: 1,
  },
}

export function EcologicalPyramidSim() {
  const [producerEnergy, setProducerEnergy] = useState(500)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const bars = energyBars(producerEnergy)
  const primary = energyAtLevel(producerEnergy, 1)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && producerEnergy >= 1000) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && producerEnergy >= 1000) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && producerEnergy >= 1000) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, producerEnergy, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Ecological pyramid (p.4)">
        Change producer energy. Watch how little reaches higher consumers.
      </ActivityCallout>
      <Slider
        label="Producer energy"
        min={100}
        max={2000}
        step={50}
        value={producerEnergy}
        onChange={setProducerEnergy}
        unit=" units"
      />
      <ReadoutBadge label="Primary consumers" value={`${primary.toFixed(0)} units`} />
      {(exploreMode || guidedStepIndex >= 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="ecological-pyramid"
      unitId="unit-01"
      unitNumber={1}
      title="Ecological Pyramid"
      slo={[
        'Describe the shape of an energy pyramid.',
        'Apply the idea that about 10% of energy transfers to the next level.',
      ]}
      bookPage={4}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setProducerEnergy(500)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '0.65rem', alignContent: 'center', justifyItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>Energy by trophic level</p>
        {[...TROPHIC_LEVELS].reverse().map((_, revI) => {
          const i = TROPHIC_LEVELS.length - 1 - revI
          const widthPct = 25 + bars[i] * 70
          const energy = energyAtLevel(producerEnergy, i)
          return (
            <div key={TROPHIC_LEVELS[i]} style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
              <div
                style={{
                  margin: '0 auto',
                  width: `${widthPct}%`,
                  minHeight: 36,
                  borderRadius: 8,
                  background: `hsl(${140 - i * 28}, 55%, ${42 + i * 6}%)`,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'width 0.3s ease',
                }}
                role="img"
                aria-label={`${LEVEL_LABELS[i]} ${energy.toFixed(0)} units`}
              >
                {LEVEL_LABELS[i]} · {energy.toFixed(0)}
              </div>
            </div>
          )
        })}
      </div>
    </SimulationShell>
  )
}
