import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { PROPERTIES, propertyById, type PropertyId } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'lustre',
    label: 'Lustre',
    detail: 'Select lustre and compare metal vs non-metal descriptions.',
  },
  {
    id: 'more',
    label: 'Other properties',
    detail: 'Try conductance and malleability next.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Metals are typically shiny, conductive, and malleable (p.51).',
    'Non-metals are often dull, poor conductors, and brittle.',
  ],
  quiz: {
    question: 'Which property lets metals be hammered into sheets?',
    choices: ['Malleability', 'Being a gas', 'Transparency'],
    correctIndex: 0,
  },
}

export function MetalPropertiesSim() {
  const [prop, setProp] = useState<PropertyId>('lustre')
  const [seen, setSeen] = useState<Record<PropertyId, boolean>>({
    lustre: true,
    conductance: false,
    malleability: false,
  })
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const demo = propertyById(prop)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && prop === 'lustre') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && seen.conductance && seen.malleability) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, prop, seen, setGuidedStepIndex, setRecapOpen])

  const pick = (id: PropertyId) => {
    setProp(id)
    setSeen((s) => ({ ...s, [id]: true }))
  }

  const controls = (
    <>
      <ActivityCallout title="Metal properties (p.51)">
        Pick lustre, conductance, or malleability to compare metals and non-metals.
      </ActivityCallout>
      <fieldset style={{ border: 'none', padding: 0, margin: '0.5rem 0' }}>
        <legend style={{ fontSize: 13, marginBottom: 6 }}>Property</legend>
        {PROPERTIES.map((p) => (
          <label key={p.id} className="gs8-check">
            <input
              type="radio"
              name="prop"
              checked={prop === p.id}
              onChange={() => pick(p.id)}
            />
            <span>{p.label}</span>
          </label>
        ))}
      </fieldset>
      <ReadoutBadge label="Property" value={demo.label} />
      {(exploreMode || (seen.conductance && seen.malleability)) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="metal-properties"
      unitId="unit-05"
      unitNumber={5}
      title="Metal Properties"
      slo={[
        'Contrast metals and non-metals for key physical properties.',
        'Use lustre, conductance, and malleability as classroom demos.',
      ]}
      bookPage={51}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setProp('lustre')
        setSeen({ lustre: true, conductance: false, malleability: false })
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{demo.label}</p>
        <div style={{ padding: '1rem', borderRadius: 12, background: '#fef9c3' }}>
          <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>Metal</p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{demo.metalText}</p>
        </div>
        <div style={{ padding: '1rem', borderRadius: 12, background: '#e2e8f0' }}>
          <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>Non-metal</p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{demo.nonmetalText}</p>
        </div>
      </div>
    </SimulationShell>
  )
}
