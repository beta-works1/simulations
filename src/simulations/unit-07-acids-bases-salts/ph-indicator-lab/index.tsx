import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useLocalizedRecap } from '../../../i18n/useLocalizedRecap'
import {
  PH_GRADIENT,
  indicatorColor,
  zoneForPhBook,
  type IndicatorId,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'acid',
    label: 'Strong acid',
    detail: 'Set pH to 2 and watch litmus turn red.',
  },
  {
    id: 'alkali',
    label: 'Strong alkali',
    detail: 'Switch to phenolphthalein and set pH to 12 — it turns pink.',
  },
  {
    id: 'neutral',
    label: 'Find neutral',
    detail: 'Set pH to 7 — zone label should read Neutral.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'pH 0–2 strong acid, 3–6 weak acid, 7 neutral, 8–11 weak alkali, 12–14 strong alkali.',
    'Indicators change colour with pH (litmus, phenolphthalein, methyl orange, turmeric).',
  ],
  quiz: {
    question: 'Phenolphthalein in a strong alkali solution appears…',
    choices: ['Colourless', 'Pink', 'Blue'],
    correctIndex: 1,
  },
}

const INDICATORS: { id: IndicatorId; label: string }[] = [
  { id: 'litmus', label: 'Litmus' },
  { id: 'phenolphthalein', label: 'Phenolphthalein' },
  { id: 'methyl-orange', label: 'Methyl orange' },
  { id: 'turmeric', label: 'Turmeric paper' },
]

export function PhIndicatorLabSim() {
  const [ph, setPh] = useState(7)
  const [indicator, setIndicator] = useState<IndicatorId>('litmus')
  const [guidedStepIndex, setGuidedStepIndex] = useState(0)
  const [exploreMode, setExploreMode] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const recap = useLocalizedRecap('ph-indicator-lab', RECAP)

  const zone = zoneForPhBook(ph)
  const strip = indicatorColor(indicator, ph)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && Math.round(ph) === 2 && indicator === 'litmus') {
      setGuidedStepIndex(1)
      setIndicator('phenolphthalein')
    }
    if (guidedStepIndex === 1 && Math.round(ph) === 12 && indicator === 'phenolphthalein') {
      setGuidedStepIndex(2)
    }
    if (guidedStepIndex === 2 && Math.round(ph) === 7) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, ph, indicator])

  const controls = (
    <>
      <ActivityCallout title="pH strip (p.76)">
        Drag the slider across 0–14. Dip a virtual indicator strip into the solution.
      </ActivityCallout>
      <Slider label="pH" min={0} max={14} step={1} value={ph} onChange={setPh} />
      <fieldset style={{ border: 'none', padding: 0, margin: '0.5rem 0' }}>
        <legend style={{ fontSize: 13, marginBottom: 6 }}>Indicator</legend>
        {INDICATORS.map((ind) => (
          <label key={ind.id} className="gs8-check">
            <input
              type="radio"
              name="indicator"
              checked={indicator === ind.id}
              onChange={() => setIndicator(ind.id)}
            />
            <span>{ind.label}</span>
          </label>
        ))}
      </fieldset>
      <ReadoutBadge label="Zone" value={zone} />
      <ReadoutBadge label="Strip" value={strip.label} />
      {(exploreMode || Math.round(ph) === 7) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="ph-indicator-lab"
      unitId="unit-07"
      unitNumber={7}
      title="pH Scale & Indicator Lab"
      slo={[
        'Read the pH scale zones from the book’s opening strip (p.76).',
        'Predict indicator colour changes for acids and alkalis.',
      ]}
      bookPage={76}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={recap}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setPh(7)
        setIndicator('litmus')
        setGuidedStepIndex(0)
        setExploreMode(false)
        setRecapOpen(false)
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <div>
          <p style={{ margin: '0 0 0.5rem', fontSize: 13, color: '#5a6b7f' }}>pH scale</p>
          <div
            style={{
              position: 'relative',
              height: 28,
              borderRadius: 8,
              background: PH_GRADIENT,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
            }}
            role="img"
            aria-label={`pH ${ph}, ${zone}`}
          >
            <div
              style={{
                position: 'absolute',
                left: `${(ph / 14) * 100}%`,
                top: -6,
                width: 4,
                height: 40,
                marginLeft: -2,
                background: '#152033',
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a6b7f', marginTop: 4 }}>
            <span>0</span>
            <span>7</span>
            <span>14</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 120,
              height: 160,
              borderRadius: 12,
              background: 'linear-gradient(180deg,#e0f2fe,#7dd3fc)',
              border: '3px solid #0284c7',
              position: 'relative',
            }}
            aria-hidden
          >
            <div
              style={{
                position: 'absolute',
                left: 48,
                top: 20,
                width: 24,
                height: 110,
                borderRadius: 4,
                background: strip.fill,
                boxShadow: '0 0 0 2px rgba(15,23,42,0.2)',
                transition: 'background 0.25s ease',
              }}
            />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>pH {ph}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem' }}>{zone}</p>
            <p style={{ margin: '0.5rem 0 0', color: '#5a6b7f' }}>
              {INDICATORS.find((i) => i.id === indicator)?.label}: {strip.label}
            </p>
          </div>
        </div>
      </div>
    </SimulationShell>
  )
}
