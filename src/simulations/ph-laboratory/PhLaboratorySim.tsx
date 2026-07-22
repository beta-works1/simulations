import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlRadioGroup,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../sims/shared/Controls'
import { SimShell } from '../../sims/shared/SimShell'
import { useCanvasLoop } from '../../sims/shared/useCanvasLoop'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import {
  GUIDE_STEPS,
  advanceGuideAfterAction,
  categoryCoach,
  getGuideStep,
  hoverExplain,
  litmusResultMessage,
  pourExplain,
  type GuideStepId,
} from './guide'
import {
  SUBSTANCES,
  createLabState,
  dipLitmus,
  emptyBeaker,
  neutralizeAcid,
  neutralizeBase,
  phCategory,
  categoryLabel,
  pourSubstance,
  revealPrediction,
  setIndicator,
  setPrediction,
  stepLab,
  undipLitmus,
  type IndicatorKind,
  type LabState,
  type Prediction,
} from './model'
import {
  buildLayout,
  drawPhLaboratory,
  hitTestLab,
  isOverBeaker,
  type LabHit,
  type LabLayout,
} from './view'
import './PhLaboratorySim.css'

export function PhLaboratorySim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<LabState>(createLabState())
  const layoutRef = useRef<LabLayout | null>(null)
  const hoverRef = useRef<LabHit>(null)
  const dragRef = useRef<
    | { type: 'sub'; id: string; x: number; y: number }
    | { type: 'litmus'; x: number; y: number }
    | null
  >(null)
  const didMoveRef = useRef(false)
  const guideIdRef = useRef<GuideStepId>('welcome')

  const [running, setRunning] = useState(true)
  const [version, setVersion] = useState(0)
  const [indicator, setIndicatorUi] = useState<IndicatorKind>('universal')
  const [prediction, setPredictionUi] = useState<Prediction>(null)
  const [guideId, setGuideId] = useState<GuideStepId>('welcome')
  const [feedback, setFeedback] = useState(
    'Follow the glowing outline. Each step explains what to do and why — including litmus paper.',
  )
  const [hoverTip, setHoverTip] = useState<string | null>(null)
  const [readout, setReadout] = useState({
    ph: '—',
    category: 'Empty',
    volume: '0 mL',
    litmus: 'Dry — not dipped yet',
  })

  guideIdRef.current = guideId
  const guide = getGuideStep(guideId)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const syncReadout = useCallback((s: LabState) => {
    setReadout({
      ph: s.volume < 0.5 ? '—' : s.displayPh.toFixed(1),
      category: s.volume < 0.5 ? 'Empty' : categoryLabel(phCategory(s.displayPh)),
      volume: `${s.volume.toFixed(0)} mL`,
      litmus: !s.litmusDipped
        ? 'Dry — drag strip into beaker'
        : !s.litmusWet
          ? 'Dipped but beaker was empty'
          : litmusResultMessage(s),
    })
  }, [])

  const setGuide = useCallback((id: GuideStepId) => {
    guideIdRef.current = id
    setGuideId(id)
  }, [])

  const progress = useCallback(
    (
      action:
        | 'start'
        | 'poured'
        | 'viewed-meter'
        | 'dipped-litmus'
        | 'changed-indicator'
        | 'neutralized'
        | 'revealed'
        | 'skip',
    ) => {
      const next = advanceGuideAfterAction(guideIdRef.current, action, stateRef.current)
      if (next !== guideIdRef.current) setGuide(next)
    },
    [setGuide],
  )

  useEffect(() => {
    const id = window.setInterval(() => syncReadout(stateRef.current), 160)
    return () => clearInterval(id)
  }, [syncReadout])

  const applyIndicator = (value: string) => {
    const next = value as IndicatorKind
    setIndicatorUi(next)
    stateRef.current = setIndicator(stateRef.current, next)
    const names: Record<IndicatorKind, string> = {
      universal: 'Universal indicator — rainbow colors across the pH scale.',
      litmus: 'Litmus in solution — red in acid, blue in base (same idea as the paper).',
      phenolphthalein: 'Phenolphthalein — colorless in acid/neutral, pink in base (pH ≳ 8.2).',
      'methyl-orange': 'Methyl orange — red in strong acid, yellow when less acidic.',
    }
    setFeedback(`Indicator changed: ${names[next]} Watch the beaker color update.`)
    progress('changed-indicator')
    bump()
  }

  useCanvasPointer(canvasRef, {
    cursorForHit: (id) =>
      id === 'litmus' || String(id).startsWith('sub-') ? 'grab' : 'pointer',
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      return hitTestLab(pt, L)
    },
    onHoverChange: (id) => {
      hoverRef.current = id as LabHit
      setHoverTip(hoverExplain(id, stateRef.current))
      if (id === 'meter' && stateRef.current.volume > 0) {
        progress('viewed-meter')
      }
      bump()
    },
    onDragStart: (id, pt) => {
      if (id === 'litmus') {
        didMoveRef.current = false
        dragRef.current = { type: 'litmus', x: pt.x, y: pt.y }
        setFeedback('Dragging litmus… drop it into the beaker liquid to dip.')
        bump()
        return
      }
      if (!String(id).startsWith('sub-')) return
      didMoveRef.current = false
      dragRef.current = { type: 'sub', id: String(id).slice(4), x: pt.x, y: pt.y }
      setFeedback('Dragging… drop into the beaker to pour and mix.')
      bump()
    },
    onDrag: (id, pt) => {
      if (dragRef.current?.type === 'litmus') {
        didMoveRef.current = true
        dragRef.current = { type: 'litmus', x: pt.x, y: pt.y }
        bump()
        return
      }
      if (!dragRef.current || dragRef.current.type !== 'sub' || !String(id).startsWith('sub-')) return
      didMoveRef.current = true
      dragRef.current = { ...dragRef.current, x: pt.x, y: pt.y }
      bump()
    },
    onDragEnd: (id) => {
      const drag = dragRef.current
      const L = layoutRef.current

      if (drag?.type === 'litmus' && L) {
        if (didMoveRef.current) {
          const overBeaker = isOverBeaker({ x: drag.x, y: drag.y }, L.beaker)
          if (overBeaker) {
            stateRef.current = dipLitmus(stateRef.current)
            setFeedback(litmusResultMessage(stateRef.current))
            syncReadout(stateRef.current)
            if (stateRef.current.litmusWet) progress('dipped-litmus')
          } else {
            setFeedback('Missed the beaker — drag litmus into the liquid and release.')
          }
        }
        dragRef.current = null
        didMoveRef.current = false
        bump()
        return
      }

      if (drag?.type === 'sub' && L && id && String(id).startsWith('sub-')) {
        const pt = { x: drag.x, y: drag.y }
        const overBeaker = isOverBeaker(pt, L.beaker)
        if (!didMoveRef.current || overBeaker) {
          stateRef.current = pourSubstance(stateRef.current, drag.id)
          stateRef.current = stepLab(stateRef.current, 0.4)
          const sub = SUBSTANCES.find((s) => s.id === drag.id)
          if (sub) setFeedback(pourExplain(sub, stateRef.current))
          syncReadout(stateRef.current)
          progress('poured')
        } else {
          setFeedback('Missed the beaker — drag the bottle onto the glass and release.')
        }
      }
      dragRef.current = null
      didMoveRef.current = false
      bump()
    },
    onTap: (id) => {
      if (!id) return
      if (id === 'litmus') {
        const before = stateRef.current
        stateRef.current = before.litmusDipped ? undipLitmus(before) : dipLitmus(before)
        const msg = litmusResultMessage(stateRef.current)
        setFeedback(msg)
        syncReadout(stateRef.current)
        if (stateRef.current.litmusWet) progress('dipped-litmus')
      } else if (String(id).startsWith('sub-')) {
        const substanceId = String(id).slice(4)
        stateRef.current = pourSubstance(stateRef.current, substanceId)
        stateRef.current = stepLab(stateRef.current, 0.4)
        const sub = SUBSTANCES.find((s) => s.id === substanceId)
        if (sub) setFeedback(pourExplain(sub, stateRef.current))
        syncReadout(stateRef.current)
        progress('poured')
      } else if (id === 'meter') {
        const s = stateRef.current
        setFeedback(
          s.volume < 1
            ? 'pH meter waits for liquid. Pour something first.'
            : `Meter reading: pH ${s.displayPh.toFixed(1)} — ${categoryCoach(phCategory(s.displayPh))}`,
        )
        progress('viewed-meter')
      } else if (id === 'beaker') {
        setFeedback(
          stateRef.current.volume < 1
            ? 'Empty beaker. Drag an acid (left side bottles) here to begin.'
            : `Beaker mixture: ${categoryLabel(phCategory(stateRef.current.displayPh))} at pH ${stateRef.current.displayPh.toFixed(1)}.`,
        )
      } else if (id === 'empty') {
        stateRef.current = emptyBeaker(stateRef.current)
        setPredictionUi(null)
        setFeedback('Beaker emptied. Pour a new substance to start another test.')
        syncReadout(stateRef.current)
      }
      bump()
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (running || stateRef.current.mixing) {
        stateRef.current = stepLab(stateRef.current, dt)
      }
      const layout = buildLayout(w, h)
      layoutRef.current = layout
      const drag = dragRef.current
      const step = getGuideStep(guideIdRef.current)
      drawPhLaboratory(
        ctx,
        w,
        h,
        stateRef.current,
        layout,
        hoverRef.current,
        drag?.type === 'sub' ? drag.id : null,
        drag?.type === 'sub' ? { x: drag.x, y: drag.y } : null,
        drag?.type === 'litmus' ? { x: drag.x, y: drag.y } : null,
        {
          title: step.title,
          body: step.doThis,
          litmusTip: step.litmusTip,
          target: step.target,
        },
      )
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  const stepIndex = GUIDE_STEPS.findIndex((s) => s.id === guideId)

  return (
    <SimShell
      title="pH Laboratory"
      subtitle="Guided lab — every step explains what to do, why it matters, and how litmus works"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createLabState()
        setIndicatorUi('universal')
        setPredictionUi(null)
        setGuide('welcome')
        setFeedback('Guide restarted. Press “Start guided lab” when you are ready.')
        setHoverTip(null)
        dragRef.current = null
        syncReadout(stateRef.current)
        bump()
      }}
      controls={
        <>
          <ControlSection title="Guided lab">
            <div className="ph-guide-progress" aria-live="polite">
              Step {guide.step} of {GUIDE_STEPS.length}
            </div>
            <ol className="ph-guide-list">
              {GUIDE_STEPS.map((s, i) => (
                <li
                  key={s.id}
                  className={
                    s.id === guideId ? 'is-current' : i < stepIndex ? 'is-done' : undefined
                  }
                >
                  <span className="ph-guide-num">{s.step}</span>
                  <span>{s.title.replace(/^Step \d+ — /, '').replace(/^Welcome.*/, 'Welcome')}</span>
                </li>
              ))}
            </ol>
            <p className="ph-guide-do">
              <strong>Do this:</strong> {guide.doThis}
            </p>
            <p className="ph-guide-why">
              <strong>Why:</strong> {guide.why}
            </p>
            {guide.litmusTip ? (
              <div className="ph-litmus-callout" role="note">
                <strong>Litmus paper</strong>
                <p>{guide.litmusTip}</p>
              </div>
            ) : null}
            <div className="ph-guide-actions">
              {guideId === 'welcome' ? (
                <button
                  type="button"
                  className="sim-shell-btn is-active"
                  onClick={() => {
                    progress('start')
                    setFeedback('Glow shows acid bottles — drag vinegar, lemon, or HCl into the beaker.')
                  }}
                >
                  Start guided lab
                </button>
              ) : guideId !== 'done' ? (
                <button
                  type="button"
                  className="sim-shell-btn"
                  onClick={() => {
                    progress('skip')
                    setFeedback('Skipped to the next step. Follow the new glow and instructions.')
                  }}
                >
                  Skip to next step
                </button>
              ) : (
                <button
                  type="button"
                  className="sim-shell-btn"
                  onClick={() => {
                    setGuide('welcome')
                    setFeedback('Guide restarted.')
                  }}
                >
                  Replay guide
                </button>
              )}
            </div>
          </ControlSection>

          <ControlSection title="What just happened">
            <p className="ph-feedback" aria-live="polite">
              {feedback}
            </p>
            {hoverTip ? (
              <p className="ph-hover-tip">
                <strong>Hover tip:</strong> {hoverTip}
              </p>
            ) : (
              <ControlHint>Hover bottles, litmus, meter, or beaker. Drag litmus into the beaker to dip.</ControlHint>
            )}
          </ControlSection>

          <ControlSection title="Readout">
            <ControlStats>
              <ControlStat label="pH meter" value={readout.ph} />
              <ControlStat label="Category" value={readout.category} />
              <ControlStat label="Volume" value={readout.volume} />
            </ControlStats>
            <div className="ph-litmus-readout">
              <strong>Litmus result</strong>
              <p>{readout.litmus}</p>
            </div>
          </ControlSection>

          <ControlSection title="Choose indicator">
            <ControlHint>
              Changing the indicator only changes the color rule — the pH number on the meter stays
              the same.
            </ControlHint>
            <ControlSelect
              label="Indicator"
              value={indicator}
              options={[
                { value: 'universal', label: 'Universal indicator' },
                { value: 'litmus', label: 'Litmus (in solution)' },
                { value: 'phenolphthalein', label: 'Phenolphthalein' },
                { value: 'methyl-orange', label: 'Methyl orange' },
              ]}
              onChange={applyIndicator}
            />
          </ControlSection>

          <ControlSection title="Neutralize">
            <ControlHint>
              Neutralize acid adds NaOH (base). Neutralize base adds HCl (acid). Watch pH move toward
              7, then dip litmus again.
            </ControlHint>
            <div className="ph-btn-row">
              <button
                type="button"
                className="sim-shell-btn"
                onClick={() => {
                  stateRef.current = neutralizeAcid(stateRef.current)
                  stateRef.current = stepLab(stateRef.current, 0.5)
                  setFeedback(
                    `Added base to neutralize acid. New pH ≈ ${stateRef.current.displayPh.toFixed(1)}. Dip litmus to confirm.`,
                  )
                  syncReadout(stateRef.current)
                  progress('neutralized')
                  bump()
                }}
              >
                Neutralize acid (+ base)
              </button>
              <button
                type="button"
                className="sim-shell-btn"
                onClick={() => {
                  stateRef.current = neutralizeBase(stateRef.current)
                  stateRef.current = stepLab(stateRef.current, 0.5)
                  setFeedback(
                    `Added acid to neutralize base. New pH ≈ ${stateRef.current.displayPh.toFixed(1)}. Dip litmus to confirm.`,
                  )
                  syncReadout(stateRef.current)
                  progress('neutralized')
                  bump()
                }}
              >
                Neutralize base (+ acid)
              </button>
            </div>
          </ControlSection>

          <ControlSection title="Predict result">
            <ControlHint>Guess from meter + litmus color, then reveal.</ControlHint>
            <ControlRadioGroup
              label="I predict the mixture is…"
              name="ph-lab-prediction"
              value={prediction ?? ''}
              options={[
                { value: 'acid', label: 'Acidic (litmus red)' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'base', label: 'Basic (litmus blue)' },
              ]}
              onChange={(v) => {
                const p = v as Prediction
                setPredictionUi(p)
                stateRef.current = setPrediction(stateRef.current, p)
                setFeedback(
                  p === 'acid'
                    ? 'You predicted acidic — expect red litmus and pH below 7.'
                    : p === 'base'
                      ? 'You predicted basic — expect blue litmus and pH above 7.'
                      : 'You predicted neutral — expect muted litmus and pH near 7.',
                )
                bump()
              }}
            />
            <button
              type="button"
              className="sim-shell-btn"
              style={{ marginTop: 8 }}
              disabled={!prediction || readout.volume === '0 mL'}
              onClick={() => {
                stateRef.current = revealPrediction(stateRef.current)
                const s = stateRef.current
                const ok = s.prediction === phCategory(s.displayPh)
                setFeedback(
                  ok
                    ? `Correct! Mixture is ${categoryLabel(phCategory(s.displayPh))}. ${litmusResultMessage(s)}`
                    : `Not quite. Actual: ${categoryLabel(phCategory(s.displayPh))} (pH ${s.displayPh.toFixed(1)}). ${litmusResultMessage(s)}`,
                )
                progress('revealed')
                bump()
              }}
            >
              Reveal answer
            </button>
          </ControlSection>
        </>
      }
    />
  )
}
