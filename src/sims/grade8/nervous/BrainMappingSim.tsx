import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStack,
  ControlStat,
  ControlStats,
  ControlToggle,
} from '../../shared/Controls'
import { drawLegend, fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { fillThemeBackground } from '../../shared/canvasTheme'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  BRAIN_PARTS,
  BRAIN_REGIONS,
  drawAnatomicalBrain,
  hitTestBrainRegion,
  regionCentroid,
  type BrainBox,
  type BrainRegionId,
} from './brainAnatomy'
import {
  createBrainMappingState,
  currentQuestion,
  selectRegion,
  tickFeedback,
  type BrainMode,
} from './brainMappingModel'

export function BrainMappingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createBrainMappingState())
  const boxRef = useRef<BrainBox>({ x: 0, y: 0, w: 1, h: 1 })
  const hoverRef = useRef<BrainRegionId | null>(null)
  const pulseRef = useRef(0)
  const hintShown = useRef(true)
  const [selected, setSelected] = useState<BrainRegionId>('frontal')
  const [mode, setMode] = useState<BrainMode>('study')
  const [showLabels, setShowLabels] = useState(true)
  const [showParts, setShowParts] = useState(true)
  const [exploredCount, setExploredCount] = useState(1)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      setExploredCount(s.explored.size)
      setQuizScore(s.quizScore)
      setQuizAttempts(s.quizAttempts)
    }, 250)
    return () => clearInterval(id)
  }, [])

  const pickRegion = (id: BrainRegionId) => {
    hintShown.current = false
    const now = performance.now() / 1000
    stateRef.current = selectRegion(stateRef.current, id, now)
    setSelected(id)
    setVersion((v) => v + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => hitTestBrainRegion(boxRef.current, pt.x, pt.y),
    onHoverChange: (id) => {
      hoverRef.current = id as BrainRegionId | null
    },
    onTap: (id) => {
      if (!id) return
      pickRegion(id as BrainRegionId)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      pulseRef.current += dt
      const now = performance.now() / 1000
      stateRef.current = tickFeedback(stateRef.current, now)
      const s = stateRef.current
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)

      fillThemeBackground(ctx, w, h, 'biology')

      const bw = Math.min(w * 0.66, (h - 88) * 0.78)
      const bh = bw * 0.96
      const box: BrainBox = {
        x: (w - bw) / 2,
        y: (h - bh) / 2 - 6,
        w: bw,
        h: bh,
      }
      boxRef.current = box

      if (hover) {
        const region = BRAIN_REGIONS.find((r) => r.id === hover)
        if (region) {
          const c = regionCentroid(box, region)
          drawHoverHalo(ctx, c.x, c.y, 36, true)
        }
      }

      drawAnatomicalBrain(ctx, box, {
        selected: s.selected,
        hover,
        showLabels: s.showLabels,
        showParts: s.showParts,
        pulse: pulseRef.current,
        feedback: s.lastAnswer,
      })

      drawLabelPill(ctx, 'Left side view', box.x + 4, box.y + box.h + 14, {
        align: 'left',
        fontSize: Math.max(10, fs - 2),
        bold: false,
        bg: 'rgba(255,255,255,0.85)',
      })

      drawLegend(
        ctx,
        BRAIN_REGIONS.map((r) => ({ color: r.accent, label: r.name.split(' ')[0] })),
        12,
        h - 14,
        Math.max(9, fs - 3),
      )

      const region = BRAIN_REGIONS.find((r) => r.id === s.selected)
      if (region) {
        const stripY = h - 52
        const stripH = 34
        const stripX = 14
        const stripW = w - 28

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(stripX + 8, stripY)
        ctx.arcTo(stripX + stripW, stripY, stripX + stripW, stripY + stripH, 8)
        ctx.arcTo(stripX + stripW, stripY + stripH, stripX, stripY + stripH, 8)
        ctx.arcTo(stripX, stripY + stripH, stripX, stripY, 8)
        ctx.arcTo(stripX, stripY, stripX + stripW, stripY, 8)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = region.accent
        ctx.lineWidth = 2
        ctx.stroke()

        drawValueChip(ctx, '', region.name, stripX + 10, stripY + stripH / 2, {
          align: 'left',
          accent: true,
          fontSize: Math.max(11, fs - 1),
        })

        ctx.fillStyle = '#34495e'
        ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const text =
          s.mode === 'study'
            ? region.action
            : s.lastAnswer === 'correct'
              ? 'Correct!'
              : s.lastAnswer === 'wrong'
                ? `Not quite — answer: ${BRAIN_REGIONS.find((r) => r.id === currentQuestion(s).answerId)?.name ?? ''}`
                : region.action
        ctx.fillText(text, stripX + Math.min(175, w * 0.28), stripY + stripH / 2)
      }

      if (s.mode === 'quiz') {
        const q = currentQuestion(s)
        drawLabelPill(ctx, q.prompt, w / 2, 22, {
          fontSize: Math.max(11, fs - 1),
          bg: 'rgba(21,32,51,0.88)',
          fg: '#fff',
        })
      } else if (hintShown.current) {
        drawHint(ctx, 'click a lobe · try quiz mode in the panel', w / 2, 22, w, h)
      }

      if (s.mode === 'study' && region) {
        const exY = box.y - 8
        drawLabelPill(ctx, `e.g. ${region.examples[0]}`, w / 2, exY, {
          fontSize: Math.max(10, fs - 2),
          bold: false,
          bg: 'rgba(255,255,255,0.9)',
        })
      }
    },
    [],
  )

  useCanvasLoop(canvasRef, draw, true, version, true)

  const syncMode = (next: BrainMode) => {
    stateRef.current = { ...stateRef.current, mode: next, lastAnswer: null, feedbackUntil: 0 }
    setMode(next)
    setVersion((v) => v + 1)
  }

  const syncToggle = (key: 'showLabels' | 'showParts', value: boolean) => {
    stateRef.current = { ...stateRef.current, [key]: value }
    if (key === 'showLabels') setShowLabels(value)
    if (key === 'showParts') setShowParts(value)
    setVersion((v) => v + 1)
  }

  const region = BRAIN_REGIONS.find((r) => r.id === selected)
  const partInfo = region ? BRAIN_PARTS.find((p) => p.id === region.part) : null

  return (
    <SimShell
      title="Brain Region Mapping"
      subtitle="PTB Ch 2 — map cerebrum lobes, cerebellum & brain stem to their functions"
      canvasRef={canvasRef}
      running
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        stateRef.current = createBrainMappingState()
        setSelected('frontal')
        setMode('study')
        setShowLabels(true)
        setShowParts(true)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Mode">
            <ControlHint>
              Study: explore each region. Quiz: read the question, then click the correct lobe.
            </ControlHint>
            <ControlSelect
              label="Activity"
              value={mode}
              options={[
                { value: 'study', label: 'Study — explore regions' },
                { value: 'quiz', label: 'Quiz — test yourself' },
              ]}
              onChange={(v) => syncMode(v as BrainMode)}
            />
          </ControlSection>

          <ControlSection title="Progress">
            <ControlStats>
              <ControlStat label="Explored" value={`${exploredCount} / ${BRAIN_REGIONS.length}`} />
              {mode === 'quiz' ? (
                <ControlStat
                  label="Score"
                  value={
                    quizAttempts > 0
                      ? `${quizScore} / ${quizAttempts}`
                      : '—'
                  }
                />
              ) : null}
            </ControlStats>
          </ControlSection>

          <ControlSection title="Display">
            <ControlToggle
              label="Show lobe labels on hover"
              checked={showLabels}
              onChange={(v) => syncToggle('showLabels', v)}
            />
            <ControlToggle
              label="Show main parts (cerebrum, cerebellum, stem)"
              checked={showParts}
              onChange={(v) => syncToggle('showParts', v)}
            />
          </ControlSection>

          {region && mode === 'study' ? (
            <ControlSection title={region.name}>
              <ControlHint>{partInfo?.label}: {partInfo?.note}</ControlHint>
              <ControlHint>{region.detail}</ControlHint>
              <ControlStack>
                {region.examples.map((ex) => (
                  <button key={ex} type="button" className="sim-shell-btn" disabled>
                    {ex}
                  </button>
                ))}
              </ControlStack>
            </ControlSection>
          ) : null}

          <ControlSection title="Regions">
            <ControlStack>
              {BRAIN_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`sim-shell-btn${selected === r.id ? ' is-active' : ''}`}
                  onClick={() => pickRegion(r.id)}
                >
                  {r.name}
                </button>
              ))}
            </ControlStack>
          </ControlSection>
        </>
      }
    />
  )
}
