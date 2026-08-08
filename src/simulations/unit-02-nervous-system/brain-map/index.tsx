import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { BRAIN_REGIONS, regionInfo, type BrainRegion } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'occipital',
    label: 'Vision centre',
    detail: 'Click the occipital lobe — it handles vision.',
  },
  {
    id: 'cerebellum',
    label: 'Balance',
    detail: 'Click the cerebellum — balance and coordination.',
  },
  {
    id: 'explore',
    label: 'Explore lobes',
    detail: 'Try frontal, parietal, or temporal, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Different brain regions specialise in different jobs (vision, hearing, movement, balance).',
    'The cerebrum’s lobes (frontal, parietal, temporal, occipital) plus the cerebellum work together.',
  ],
  quiz: {
    question: 'Which region is mainly for vision?',
    choices: ['Temporal lobe', 'Occipital lobe', 'Cerebellum'],
    correctIndex: 1,
  },
}

export function BrainMapSim() {
  const [region, setRegion] = useState<BrainRegion | null>(null)
  const [visited, setVisited] = useState<BrainRegion[]>([])
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const info = region ? regionInfo(region) : null

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && region === 'occipital') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && region === 'cerebellum') setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && visited.length >= 3) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, region, visited, setGuidedStepIndex, setRecapOpen])

  const select = (id: BrainRegion) => {
    setRegion(id)
    setVisited((v) => (v.includes(id) ? v : [...v, id]))
  }

  const controls = (
    <>
      <ActivityCallout title="Brain map (p.15)">
        Click a region to read its main function.
      </ActivityCallout>
      <div style={{ display: 'grid', gap: 8 }}>
        {BRAIN_REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="gs8-btn"
            style={{
              width: '100%',
              background: region === r.id ? '#c026d3' : undefined,
            }}
            onClick={() => select(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <ReadoutBadge label="Selected" value={info?.label ?? '—'} />
      {(exploreMode || visited.length >= 3) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="brain-map"
      unitId="unit-02"
      unitNumber={2}
      title="Brain Map"
      slo={[
        'Locate major brain regions on a simple map.',
        'Match each region to a key function in plain language.',
      ]}
      bookPage={15}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setRegion(null)
        setVisited([])
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          {BRAIN_REGIONS.map((r) => {
            const on = region === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => select(r.id)}
                style={{
                  padding: '1rem',
                  borderRadius: 12,
                  border: `2px solid ${on ? '#c026d3' : '#cbd5e1'}`,
                  background: on ? '#fae8ff' : '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: on ? '#86198f' : '#334155',
                  gridColumn: r.id === 'cerebellum' ? '1 / -1' : undefined,
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
        <div
          style={{
            maxWidth: 420,
            margin: '0 auto',
            padding: '1rem',
            borderRadius: 12,
            background: '#f1f5f9',
            minHeight: 72,
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>{info?.label ?? 'Select a region'}</p>
          <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
            {info?.functionText ?? 'Tap frontal, parietal, temporal, occipital, or cerebellum.'}
          </p>
        </div>
      </div>
    </SimulationShell>
  )
}
