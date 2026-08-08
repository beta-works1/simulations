import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import {
  EQUIVALENCE_DROPS,
  indicatorAppearance,
  isAtEquivalence,
  phCurvePoints,
  phFromDrops,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'start',
    label: 'Pink alkali',
    detail: 'Start with few drops — phenolphthalein is pink in alkali.',
  },
  {
    id: 'equiv',
    label: 'Reach equivalence',
    detail: `Add acid until about ${EQUIVALENCE_DROPS} drops — colour goes clear near pH 7.`,
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'In titration, acid is added until alkali is just neutralised (equivalence).',
    'Phenolphthalein is pink in alkali and colourless near/after equivalence (p.82).',
  ],
  quiz: {
    question: 'At the equivalence point with phenolphthalein, the solution looks…',
    choices: ['Deep pink', 'Clear / colourless', 'Bright blue'],
    correctIndex: 1,
  },
}

export function NeutralizationTitrationSim() {
  const [drops, setDrops] = useState(0)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()

  const ph = phFromDrops(drops)
  const strip = indicatorAppearance(drops)
  const points = phCurvePoints()

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && drops < 5) setGuidedStepIndex(0)
    if (guidedStepIndex === 0 && drops >= 0 && strip.label.includes('Pink')) {
      /* stay until student adds drops */
    }
    if (guidedStepIndex === 0 && drops > 5) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && isAtEquivalence(drops)) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, drops, strip.label, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Neutralisation titration (p.82)">
        Add HCl drops to alkali + phenolphthalein. Watch pH fall and pink turn clear.
      </ActivityCallout>
      <Slider label="Acid drops" min={0} max={40} step={1} value={drops} onChange={setDrops} />
      <ReadoutBadge label="pH" value={ph.toFixed(1)} />
      <ReadoutBadge label="Indicator" value={strip.label} />
      {(exploreMode || isAtEquivalence(drops) || drops > EQUIVALENCE_DROPS) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  const w = 320
  const h = 140
  const path = points
    .map((p, i) => {
      const x = (p.drops / 40) * w
      const y = h - ((p.ph - 2) / 9) * (h - 16) - 8
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <SimulationShell
      simId="neutralization-titration"
      unitId="unit-07"
      unitNumber={7}
      title="Neutralisation Titration"
      slo={[
        'Describe how pH changes during acid–alkali titration.',
        'Link phenolphthalein colour change to the equivalence point.',
      ]}
      bookPage={82}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setDrops(0)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <svg width={w} height={h} role="img" aria-label="pH versus drops curve">
          <rect width={w} height={h} fill="#f1f5f9" rx={8} />
          <path d={path} fill="none" stroke="#0369a1" strokeWidth={2.5} />
          <circle
            cx={(drops / 40) * w}
            cy={h - ((ph - 2) / 9) * (h - 16) - 8}
            r={5}
            fill="#ec4899"
          />
          <text x={8} y={16} fontSize={11} fill="#5a6b7f">
            pH vs drops
          </text>
        </svg>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: strip.fill,
              border: '3px solid #94a3b8',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
              transition: 'background 0.25s',
            }}
            aria-hidden
          />
          <div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>pH {ph.toFixed(1)}</p>
            <p style={{ margin: '0.35rem 0 0', color: '#5a6b7f' }}>{strip.label}</p>
          </div>
        </div>
      </div>
    </SimulationShell>
  )
}
