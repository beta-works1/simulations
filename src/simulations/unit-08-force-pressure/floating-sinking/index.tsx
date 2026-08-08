import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import {
  WATER_DENSITY,
  buoyancyLabel,
  buoyancyState,
  displacedVolumeFraction,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'float',
    label: 'Make it float',
    detail: 'Set object density below 1.0 g/cm³ (water). Part of the object should stay above the surface.',
  },
  {
    id: 'sink',
    label: 'Make it sink',
    detail: 'Raise density above water. The object sinks and displaces its full volume.',
  },
  {
    id: 'readout',
    label: 'Read displaced volume',
    detail: 'Compare the displaced-volume fraction, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'An object floats when its density is less than the liquid’s density; it sinks when denser.',
    'A floating object displaces a volume of liquid whose weight equals the object’s weight.',
  ],
  quiz: {
    question: 'An object with density 0.7 g/cm³ in water (1.0 g/cm³) will…',
    choices: ['Sink', 'Float', 'Dissolve'],
    correctIndex: 1,
  },
}

export function FloatingSinkingSim() {
  const [density, setDensity] = useState(1.2)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const state = buoyancyState(density)
  const frac = displacedVolumeFraction(density)
  const displacedPct = (frac * 100).toFixed(0)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && state === 'floats') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && state === 'sinks') setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && state === 'sinks') setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, state, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Float or sink (p.104)">
        Change the object’s density. Water density stays 1.0 g/cm³. Watch whether it floats or sinks.
      </ActivityCallout>
      <Slider
        label="Object density"
        min={0.2}
        max={2}
        step={0.05}
        value={density}
        onChange={setDensity}
        unit=" g/cm³"
      />
      <ReadoutBadge label="Water density" value={`${WATER_DENSITY.toFixed(1)} g/cm³`} />
      <ReadoutBadge label="Displaced volume" value={`${displacedPct}% of object`} />
      <ReadoutBadge label="Result" value={state === 'floats' ? 'Floats' : state === 'sinks' ? 'Sinks' : 'Suspends'} />
      {(exploreMode || guidedStepIndex >= 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  const waterTop = 90
  const objH = 70
  const submerged = frac * objH
  const topY =
    state === 'sinks'
      ? waterTop + 70
      : state === 'suspends'
        ? waterTop + 20
        : waterTop + submerged - objH

  return (
    <SimulationShell
      simId="floating-sinking"
      unitId="unit-08"
      unitNumber={8}
      title="Floating and Sinking"
      slo={[
        'Compare object density with water density to predict float or sink.',
        'Relate displaced volume to floating and sinking.',
      ]}
      bookPage={104}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setDensity(1.2)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '0.75rem', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>{buoyancyLabel(density)}</p>
        <svg viewBox="0 0 360 260" width="100%" height="240" role="img" aria-label={buoyancyLabel(density)}>
          <rect x="40" y="40" width="280" height="200" rx="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
          <rect x="40" y={waterTop} width="280" height={140} fill="#38bdf8" opacity="0.55" />
          <text x="52" y="62" fill="#5a6b7f" fontSize="12">
            Water ρ = {WATER_DENSITY.toFixed(1)}
          </text>
          <rect
            x="140"
            y={topY}
            width="80"
            height={objH}
            rx="8"
            fill={state === 'sinks' ? '#78716c' : '#f59e0b'}
            stroke="#44403c"
            strokeWidth="3"
            style={{ transition: 'y 0.35s ease' }}
          />
          <text x="152" y={topY + 40} fill="#1c1917" fontSize="12" fontWeight="700">
            ρ = {density.toFixed(2)}
          </text>
        </svg>
      </div>
    </SimulationShell>
  )
}
