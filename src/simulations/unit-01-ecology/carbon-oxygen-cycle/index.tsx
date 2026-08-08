import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { DEFAULT_FLAGS, gasLevels, type ProcessFlags } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'photo',
    label: 'Photosynthesis',
    detail: 'Turn photosynthesis on (and combustion off). Watch O₂ rise and CO₂ fall.',
  },
  {
    id: 'respire',
    label: 'Add respiration',
    detail: 'Keep photosynthesis on and turn respiration on — both gases shift toward balance.',
  },
  {
    id: 'burn',
    label: 'Combustion',
    detail: 'Turn combustion on — CO₂ climbs. Then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Photosynthesis takes in CO₂ and releases O₂; respiration does the opposite.',
    'Combustion (burning) adds CO₂ and uses O₂, tipping the atmospheric balance.',
  ],
  quiz: {
    question: 'Which process lowers atmospheric CO₂?',
    choices: ['Respiration', 'Photosynthesis', 'Combustion'],
    correctIndex: 1,
  },
}

export function CarbonOxygenCycleSim() {
  const [flags, setFlags] = useState<ProcessFlags>(DEFAULT_FLAGS)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const gases = gasLevels(flags)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && flags.photosynthesis && !flags.combustion) {
      setGuidedStepIndex(1)
    }
    if (guidedStepIndex === 1 && flags.photosynthesis && flags.respiration) {
      setGuidedStepIndex(2)
    }
    if (guidedStepIndex === 2 && flags.combustion) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, flags, setGuidedStepIndex, setRecapOpen])

  const setFlag = (key: keyof ProcessFlags, value: boolean) =>
    setFlags((f) => ({ ...f, [key]: value }))

  const controls = (
    <>
      <ActivityCallout title="Carbon–oxygen cycle (p.2)">
        Toggle processes and watch the CO₂ and O₂ gauges shift.
      </ActivityCallout>
      <ToggleSwitch
        label="Photosynthesis"
        checked={flags.photosynthesis}
        onChange={(v) => setFlag('photosynthesis', v)}
      />
      <ToggleSwitch
        label="Respiration"
        checked={flags.respiration}
        onChange={(v) => setFlag('respiration', v)}
      />
      <ToggleSwitch
        label="Combustion"
        checked={flags.combustion}
        onChange={(v) => setFlag('combustion', v)}
      />
      <ReadoutBadge label="CO₂" value={`${gases.co2}%`} />
      <ReadoutBadge label="O₂" value={`${gases.o2}%`} />
      {(exploreMode || guidedStepIndex >= 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="carbon-oxygen-cycle"
      unitId="unit-01"
      unitNumber={1}
      title="Carbon–Oxygen Cycle"
      slo={[
        'Link photosynthesis, respiration, and combustion to CO₂ and O₂ changes.',
        'Explain how human combustion can tip the atmospheric balance.',
      ]}
      bookPage={2}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setFlags(DEFAULT_FLAGS)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>Atmospheric gauges</p>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(
            [
              { key: 'CO₂', value: gases.co2, color: '#64748b' },
              { key: 'O₂', value: gases.o2, color: '#0ea5e9' },
            ] as const
          ).map((g) => (
            <div key={g.key} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 160,
                  borderRadius: 12,
                  border: '3px solid #334155',
                  background: '#e2e8f0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                role="img"
                aria-label={`${g.key} ${g.value}%`}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${g.value}%`,
                    background: g.color,
                    transition: 'height 0.3s ease',
                  }}
                />
              </div>
              <p style={{ margin: '0.5rem 0 0', fontWeight: 700 }}>{g.key}</p>
              <p style={{ margin: 0, color: '#5a6b7f' }}>{g.value}%</p>
            </div>
          ))}
        </div>
      </div>
    </SimulationShell>
  )
}
