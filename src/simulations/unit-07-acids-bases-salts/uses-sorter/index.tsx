import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { SUBSTANCES, allUsesCorrect, scoreUses } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'match',
    label: 'Match uses',
    detail: 'For each substance, pick its everyday use from the dropdown.',
  },
  {
    id: 'finish',
    label: 'Finish all',
    detail: 'Get every match correct, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Acids, alkalis, and salts have common uses at home and in industry (p.80).',
    'Examples: vinegar in food, NaOH in soap, limestone in building/antacids.',
  ],
  quiz: {
    question: 'NaOH is commonly used in…',
    choices: ['Making soap', 'Soft drinks only', 'Baking cakes only'],
    correctIndex: 0,
  },
}

export function UsesSorterSim() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const score = scoreUses(answers)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && score.correct >= 1) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && allUsesCorrect(answers)) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, score.correct, answers, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Uses of acids & salts (p.80)">
        Match each substance to a typical use.
      </ActivityCallout>
      <ReadoutBadge label="Score" value={`${score.correct} / ${score.total}`} />
      {(exploreMode || allUsesCorrect(answers)) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="uses-sorter"
      unitId="unit-07"
      unitNumber={7}
      title="Acids & Salts Uses Sorter"
      slo={[
        'Match common substances to everyday uses.',
        'Recall book examples of acids, alkalis, and salts in daily life.',
      ]}
      bookPage={80}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setAnswers({})
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
        {SUBSTANCES.map((s) => (
          <label key={s.id} style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{s.substance}</span>
            <select
              value={answers[s.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [s.id]: e.target.value }))}
              style={{ minHeight: 44, borderRadius: 8, padding: '0 8px' }}
              aria-label={`Use for ${s.substance}`}
            >
              <option value="">Select use…</option>
              {s.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </SimulationShell>
  )
}
