import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import {
  EQUATION_BANK,
  TYPE_OPTIONS,
  allCorrect,
  scoreAnswers,
  type ReactionType,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'classify',
    label: 'Classify five',
    detail: 'Use each dropdown to pick the reaction type for that equation.',
  },
  {
    id: 'score',
    label: 'Check score',
    detail: 'Aim for 5/5, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Combination, decomposition, displacement, double displacement, and combustion are key types (p.57).',
    'Look at reactants and products to decide which pattern fits.',
  ],
  quiz: {
    question: '2HgO → 2Hg + O₂ is an example of…',
    choices: ['Combination', 'Decomposition', 'Combustion'],
    correctIndex: 1,
  },
}

type Answers = Record<string, ReactionType | ''>

export function ReactionTypeSorterSim() {
  const [answers, setAnswers] = useState<Answers>(() =>
    Object.fromEntries(EQUATION_BANK.map((e) => [e.id, '' as const])),
  )
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()

  const score = scoreAnswers(answers)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && score.correct >= 1) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && allCorrect(answers)) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, score.correct, answers, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Reaction types (p.57)">
        Match each equation to its type. Your score updates live.
      </ActivityCallout>
      <ReadoutBadge label="Score" value={`${score.correct} / ${score.total}`} />
      {(exploreMode || score.correct === score.total) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="reaction-type-sorter"
      unitId="unit-06"
      unitNumber={6}
      title="Reaction Type Sorter"
      slo={[
        'Classify chemical equations by reaction type.',
        'Use product/reactant patterns to decide the type.',
      ]}
      bookPage={57}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setAnswers(Object.fromEntries(EQUATION_BANK.map((e) => [e.id, '' as const])))
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
        {EQUATION_BANK.map((item) => (
          <label key={item.id} style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{item.equation}</span>
            <select
              value={answers[item.id] ?? ''}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [item.id]: e.target.value as ReactionType | '' }))
              }
              style={{ minHeight: 44, borderRadius: 8, padding: '0 8px' }}
              aria-label={`Type for ${item.equation}`}
            >
              <option value="">Select type…</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <p style={{ margin: 0, color: '#5a6b7f' }}>
          Score: {score.correct}/{score.total} ({score.percent}%)
        </p>
      </div>
    </SimulationShell>
  )
}
