import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { GALAXIES, galaxyById, type GalaxyType } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'spiral',
    label: 'Spiral',
    detail: 'Select the spiral galaxy card — our Milky Way is one.',
  },
  {
    id: 'compare',
    label: 'Compare shapes',
    detail: 'Open elliptical and irregular cards to compare structure.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Galaxies are huge star systems; common shapes are spiral, elliptical, and irregular (p.148).',
    'The Milky Way is a spiral galaxy.',
  ],
  quiz: {
    question: 'The Milky Way is best described as a…',
    choices: ['Spiral galaxy', 'Only an irregular cloud', 'Single star'],
    correctIndex: 0,
  },
}

export function GalaxyExplorerSim() {
  const [selected, setSelected] = useState<GalaxyType>('spiral')
  const [seen, setSeen] = useState<Record<GalaxyType, boolean>>({
    spiral: true,
    elliptical: false,
    irregular: false,
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
  const card = galaxyById(selected)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && selected === 'spiral') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && seen.elliptical && seen.irregular) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, selected, seen, setGuidedStepIndex, setRecapOpen])

  const pick = (id: GalaxyType) => {
    setSelected(id)
    setSeen((s) => ({ ...s, [id]: true }))
  }

  const controls = (
    <>
      <ActivityCallout title="Galaxy gallery (p.148)">
        Tap spiral, elliptical, and irregular to compare shapes and examples.
      </ActivityCallout>
      <ReadoutBadge label="Selected" value={card.name} />
      {(exploreMode || (seen.elliptical && seen.irregular)) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="galaxy-explorer"
      unitId="unit-12"
      unitNumber={12}
      title="Galaxy Explorer"
      slo={[
        'Recognise spiral, elliptical, and irregular galaxies.',
        'Give an everyday example of each type.',
      ]}
      bookPage={148}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setSelected('spiral')
        setSeen({ spiral: true, elliptical: false, irregular: false })
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GALAXIES.map((g) => (
            <button
              key={g.id}
              type="button"
              className="gs8-btn"
              style={{
                background: selected === g.id ? '#152033' : '#e2e8f0',
                color: selected === g.id ? '#fff' : '#152033',
              }}
              onClick={() => pick(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{card.name} galaxy</p>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{card.blurb}</p>
        <p style={{ margin: 0, color: '#5a6b7f' }}>Examples: {card.example}</p>
      </div>
    </SimulationShell>
  )
}
