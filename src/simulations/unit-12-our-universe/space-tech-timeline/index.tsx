import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { TIMELINE, timelineItem, type TimelineId } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'hubble',
    label: 'Hubble',
    detail: 'Select Hubble Space Telescope on the timeline.',
  },
  {
    id: 'rest',
    label: 'Probes & tech',
    detail: 'Open space probes and everyday space tech items.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Telescopes like Hubble expand what we can see from orbit (p.158).',
    'Probes explore planets; satellite tech supports GPS, weather, and communications.',
  ],
  quiz: {
    question: 'Hubble is best known as a…',
    choices: ['Space telescope', 'Fuel truck', 'Weather balloon only'],
    correctIndex: 0,
  },
}

export function SpaceTechTimelineSim() {
  const [selected, setSelected] = useState<TimelineId>('hubble')
  const [seen, setSeen] = useState<Record<TimelineId, boolean>>({
    hubble: true,
    probes: false,
    tech: false,
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
  const item = timelineItem(selected)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && selected === 'hubble') setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && seen.probes && seen.tech) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, selected, seen, setGuidedStepIndex, setRecapOpen])

  const pick = (id: TimelineId) => {
    setSelected(id)
    setSeen((s) => ({ ...s, [id]: true }))
  }

  const controls = (
    <>
      <ActivityCallout title="Space technology (p.158)">
        Select Hubble, probes, and everyday tech on the timeline.
      </ActivityCallout>
      <label style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>Timeline item</span>
        <select
          value={selected}
          onChange={(e) => pick(e.target.value as TimelineId)}
          style={{ minHeight: 44, borderRadius: 8, padding: '0 8px' }}
        >
          {TIMELINE.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <ReadoutBadge label="Era" value={item.yearHint} />
      {(exploreMode || (seen.probes && seen.tech)) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="space-tech-timeline"
      unitId="unit-12"
      unitNumber={12}
      title="Space Tech Timeline"
      slo={[
        'Identify Hubble, probes, and satellite tech on a simple timeline.',
        'Connect space research to everyday technology.',
      ]}
      bookPage={158}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setSelected('hubble')
        setSeen({ hubble: true, probes: false, tech: false })
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIMELINE.map((t) => (
            <button
              key={t.id}
              type="button"
              className="gs8-btn"
              style={{
                background: selected === t.id ? '#152033' : '#e2e8f0',
                color: selected === t.id ? '#fff' : '#152033',
              }}
              onClick={() => pick(t.id)}
            >
              {t.title}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{item.title}</p>
        <p style={{ margin: 0, color: '#5a6b7f' }}>{item.yearHint}</p>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{item.detail}</p>
      </div>
    </SimulationShell>
  )
}
