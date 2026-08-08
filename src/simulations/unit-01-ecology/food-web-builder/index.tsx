import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, Checkbox, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import {
  FOOD_LINKS,
  activeLinkCount,
  hasGrassRabbitFox,
  toggleLink,
  type LinkId,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'grass-rabbit',
    label: 'Grass → Rabbit',
    detail: 'Turn on the link from grass (producer) to rabbit (primary consumer).',
  },
  {
    id: 'rabbit-fox',
    label: 'Rabbit → Fox',
    detail: 'Add rabbit → fox so energy reaches a secondary consumer.',
  },
  {
    id: 'chain',
    label: 'See the chain',
    detail: 'With grass → rabbit → fox complete, open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'A food chain shows who eats whom: producer → primary consumer → secondary consumer.',
    'A food web is made of many overlapping food chains in an ecosystem.',
  ],
  quiz: {
    question: 'In grass → rabbit → fox, the rabbit is a…',
    choices: ['Producer', 'Primary consumer', 'Decomposer'],
    correctIndex: 1,
  },
}

export function FoodWebBuilderSim() {
  const [active, setActive] = useState<LinkId[]>([])
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const complete = hasGrassRabbitFox(active)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && active.includes('grass-rabbit')) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && active.includes('rabbit-fox')) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && complete) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, active, complete, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Food web links (p.4)">
        Toggle feeding links. Build the grass → rabbit → fox chain first.
      </ActivityCallout>
      {FOOD_LINKS.map((link) => (
        <Checkbox
          key={link.id}
          label={link.label}
          checked={active.includes(link.id)}
          onChange={() => {
            setActive((a) => toggleLink(a, link.id))
          }}
        />
      ))}
      <ReadoutBadge label="Links on" value={String(activeLinkCount(active))} />
      <ReadoutBadge label="Chain" value={complete ? 'Complete' : 'Incomplete'} />
      {(exploreMode || complete) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="food-web-builder"
      unitId="unit-01"
      unitNumber={1}
      title="Food Web Builder"
      slo={[
        'Build a simple food chain from producer to secondary consumer.',
        'Distinguish a food chain from a wider food web.',
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
        setActive([])
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>Active feeding links</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
          {FOOD_LINKS.map((link) => {
            const on = active.includes(link.id)
            return (
              <div
                key={link.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: `2px solid ${on ? '#15803d' : '#cbd5e1'}`,
                  background: on ? '#dcfce7' : '#f8fafc',
                  fontWeight: 600,
                  color: on ? '#14532d' : '#64748b',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.from} → {link.to}
              </div>
            )
          })}
        </div>
        {complete && (
          <p style={{ margin: 0, fontWeight: 600, color: '#14532d' }}>
            Grass → Rabbit → Fox chain is connected.
          </p>
        )}
      </div>
    </SimulationShell>
  )
}
