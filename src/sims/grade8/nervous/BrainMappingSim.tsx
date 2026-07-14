import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStack,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  BRAIN_PARTS,
  BRAIN_REGIONS,
  drawAnatomicalBrain,
  ensureBrainImage,
  hitTestBrainRegion,
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
  const [exploredCount, setExploredCount] = useState(1)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    ensureBrainImage()
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

      // Clean light stage — brain is the hero
      ctx.fillStyle = '#f4f6f8'
      ctx.fillRect(0, 0, w, h)

      const bw = Math.min(w * 0.78, (h - 64) * 0.88)
      const bh = bw * (480 / 640)
      const box: BrainBox = {
        x: (w - bw) / 2,
        y: (h - bh) / 2 - 10,
        w: bw,
        h: bh,
      }
      boxRef.current = box

      drawAnatomicalBrain(ctx, box, {
        selected: s.selected,
        hover,
        pulse: pulseRef.current,
        feedback: s.lastAnswer,
      })

      const region = BRAIN_REGIONS.find((r) => r.id === s.selected)
      if (region) {
        const stripY = h - 44
        const stripH = 32
        const stripX = 16
        const stripW = w - 32

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
                ? `Not quite — ${BRAIN_REGIONS.find((r) => r.id === currentQuestion(s).answerId)?.name ?? ''}`
                : region.action
        ctx.fillText(text, stripX + Math.min(170, w * 0.28), stripY + stripH / 2)
      }

      if (s.mode === 'quiz') {
        const q = currentQuestion(s)
        drawLabelPill(ctx, q.prompt, w / 2, 22, {
          fontSize: Math.max(11, fs - 1),
          bg: 'rgba(21,32,51,0.9)',
          fg: '#fff',
        })
      } else if (hintShown.current) {
        drawHint(ctx, 'click a colored region on the brain', w / 2, 20, w, h)
      }
    },
    [],
  )

  useCanvasLoop(canvasRef, draw, true, version, true)

  const syncMode = (next: BrainMode) => {
    stateRef.current = {
      ...stateRef.current,
      mode: next,
      lastAnswer: null,
      feedbackUntil: 0,
      showLabels: true,
      showParts: false,
    }
    setMode(next)
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
                  value={quizAttempts > 0 ? `${quizScore} / ${quizAttempts}` : '—'}
                />
              ) : null}
            </ControlStats>
          </ControlSection>

          {region && mode === 'study' ? (
            <ControlSection title={region.name}>
              <ControlHint>
                {partInfo?.label}: {partInfo?.note}
              </ControlHint>
              <ControlHint>{region.detail}</ControlHint>
              <ControlHint>Examples: {region.examples.join(' · ')}</ControlHint>
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
