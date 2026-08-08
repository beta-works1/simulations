import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { zoomFromLevel } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'chromosome',
    label: 'Chromosome view',
    detail: 'Keep the zoom at chromosome level — packed DNA during division.',
  },
  {
    id: 'helix',
    label: 'Double helix',
    detail: 'Slide to the middle — see the twisted ladder shape.',
  },
  {
    id: 'bases',
    label: 'Base pairs',
    detail: 'Zoom all the way in to A–T and C–G pairs, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Chromosomes are tightly packed DNA; zooming in reveals the double helix.',
    'Base pairs (A–T and C–G) carry the hereditary code.',
  ],
  quiz: {
    question: 'Which bases pair correctly in DNA?',
    choices: ['A with C, T with G', 'A with T, C with G', 'A with G, C with T'],
    correctIndex: 1,
  },
}

export function DnaZoomSim() {
  const [level, setLevel] = useState(0)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const zoom = zoomFromLevel(level)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && level === 0) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && level === 1) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && level === 2) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, level, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="DNA structure (p.28)">
        Zoom from chromosome → double helix → base pairs.
      </ActivityCallout>
      <Slider label="Zoom level" min={0} max={2} step={1} value={level} onChange={setLevel} />
      <ReadoutBadge label="View" value={zoom.label} />
      {(exploreMode || level === 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="dna-zoom"
      unitId="unit-03"
      unitNumber={3}
      title="DNA Zoom"
      slo={[
        'Relate chromosome, helix, and base-pair scales of DNA.',
        'Recall complementary base pairing (A–T, C–G).',
      ]}
      bookPage={28}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setLevel(0)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center', justifyItems: 'center' }}>
        <div
          style={{
            width: level === 0 ? 120 : level === 1 ? 180 : 240,
            height: level === 0 ? 160 : 120,
            borderRadius: level === 0 ? 16 : 12,
            background:
              level === 0
                ? 'linear-gradient(180deg,#67e8f9,#0891b2)'
                : level === 1
                  ? 'repeating-linear-gradient(45deg,#06b6d4,#06b6d4 8px,#155e75 8px,#155e75 16px)'
                  : '#ecfeff',
            border: '3px solid #155e75',
            display: 'grid',
            placeItems: 'center',
            transition: 'width 0.3s ease, height 0.3s ease',
            padding: 12,
          }}
          role="img"
          aria-label={zoom.label}
        >
          {level === 2 ? (
            <p style={{ margin: 0, fontWeight: 700, color: '#155e75', textAlign: 'center' }}>
              A═T · C≡G
            </p>
          ) : (
            <p style={{ margin: 0, fontWeight: 700, color: level === 1 ? '#ecfeff' : '#164e63' }}>{zoom.label}</p>
          )}
        </div>
        <p style={{ margin: 0, maxWidth: 360, textAlign: 'center', color: '#334155' }}>{zoom.detail}</p>
      </div>
    </SimulationShell>
  )
}
