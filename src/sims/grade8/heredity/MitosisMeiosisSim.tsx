import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, withShadow } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  createMitosisMeiosisState,
  setMitosisStage,
  stagesForMode,
  stepMitosisMeiosis,
  type DivisionMode,
} from './mitosisMeiosisModel'

type ChipHit = { id: number; x: number; y: number; w: number; h: number }

type Layout = {
  scrub: { x: number; y: number; w: number; h: number }
  handle: { x: number; y: number; r: number }
  chips: ChipHit[]
  stageCount: number
}

export function MitosisMeiosisSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<DivisionMode>('mitosis')
  const stateRef = useRef(createMitosisMeiosisState())
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const scrubbingRef = useRef(false)
  const hintShown = useRef(true)
  const [version, setVersion] = useState(0)
  const [stage, setStage] = useState(0)

  const stages = stagesForMode(mode)
  const stageRef = useRef(stage)
  stageRef.current = stage

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current.stage
      if (s !== stageRef.current) setStage(s)
    }, 120)
    return () => clearInterval(id)
  }, [])

  const applyStage = (next: number) => {
    const clamped = clamp(Math.round(next), 0, stages.length - 1)
    stateRef.current = setMitosisStage(stateRef.current, clamped)
    setStage(clamped)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      for (const c of L.chips) {
        if (pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h) return `chip:${c.id}`
      }
      const h = L.handle
      if (Math.hypot(pt.x - h.x, pt.y - h.y) < h.r + 10) return 'scrub'
      const t = L.scrub
      if (pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h) return 'scrub'
      return null
    },
    cursorForHit: (id) => (id.startsWith('chip:') ? 'pointer' : 'grab'),
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDragStart: (id) => {
      if (id === 'scrub') scrubbingRef.current = true
    },
    onDragEnd: () => {
      scrubbingRef.current = false
    },
    onDrag: (id, pt) => {
      const L = layoutRef.current
      if (!L || id !== 'scrub') return
      hintShown.current = false
      const t = clamp((pt.x - L.scrub.x) / L.scrub.w, 0, 1)
      applyStage(t * (L.stageCount - 1))
    },
    onTap: (id) => {
      if (!id?.startsWith('chip:')) return
      hintShown.current = false
      applyStage(Number(id.slice(5)))
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const advancing = running && !scrubbingRef.current
      const prev = stateRef.current.stage
      stateRef.current = stepMitosisMeiosis(stateRef.current, dt, advancing, stages.length)
      if (stateRef.current.stage !== prev) setStage(stateRef.current.stage)
      const stageIdx = stateRef.current.stage
      const hover = hoverRef.current
      const fs = fontPx(14, w, h)

      clearThemedScene(ctx, w, h, 'biology')

      const cx = w / 2
      const cy = h * 0.48
      const cellR = Math.min(w, h) * 0.28

      withShadow(ctx, () => {
        ctx.beginPath()
        ctx.arc(cx, cy, cellR, 0, Math.PI * 2)
        ctx.fillStyle = '#d6eaf8'
        ctx.fill()
      })
      ctx.strokeStyle = '#5dade2'
      ctx.lineWidth = 4
      ctx.stroke()

      const nChrom = 4
      const progress = stageIdx / Math.max(1, stages.length - 1)

      for (let i = 0; i < nChrom; i++) {
        const baseAngle = (i / nChrom) * Math.PI * 2
        let x = cx
        let y = cy
        if (stageIdx <= 1) {
          x = cx + Math.cos(baseAngle) * cellR * 0.35
          y = cy + Math.sin(baseAngle) * cellR * 0.35
        } else if (mode === 'mitosis' && stageIdx === 2) {
          x = cx + (i % 2 === 0 ? -1 : 1) * cellR * 0.45
          y = cy + (i - 1.5) * 18
        } else if (mode === 'mitosis' && stageIdx >= 3) {
          const side = i < 2 ? -1 : 1
          x = cx + side * cellR * (0.55 + progress * 0.1)
          y = cy + ((i % 2) - 0.5) * 30
        } else if (mode === 'meiosis') {
          if (stageIdx <= 2) {
            x = cx + Math.cos(baseAngle) * cellR * (0.2 + stageIdx * 0.1)
            y = cy + Math.sin(baseAngle) * cellR * (0.2 + stageIdx * 0.1)
          } else {
            x = cx + (i % 2 === 0 ? -1 : 1) * cellR * 0.55
            y = cy + (i < 2 ? -1 : 1) * cellR * 0.45
          }
        }

        ctx.strokeStyle = i % 2 === 0 ? '#c0392b' : '#8e44ad'
        ctx.lineWidth = 5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x - 10, y - 16)
        ctx.quadraticCurveTo(x, y, x + 10, y + 16)
        ctx.stroke()
        if (mode === 'mitosis' && stageIdx < 2) {
          ctx.beginPath()
          ctx.moveTo(x + 6, y - 16)
          ctx.quadraticCurveTo(x + 14, y, x + 22, y + 16)
          ctx.stroke()
        }
      }

      if ((mode === 'mitosis' && stageIdx >= 4) || (mode === 'meiosis' && stageIdx >= 5)) {
        ctx.strokeStyle = '#85929e'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, cy - cellR)
        ctx.lineTo(cx, cy + cellR)
        if (mode === 'meiosis') {
          ctx.moveTo(cx - cellR, cy)
          ctx.lineTo(cx + cellR, cy)
        }
        ctx.stroke()
      }

      drawLabelPill(ctx, `${mode === 'mitosis' ? 'Mitosis' : 'Meiosis'} — ${stages[stageIdx]}`, w / 2, 24, {
        fontSize: fs + 1,
      })
      drawLabelPill(
        ctx,
        mode === 'mitosis'
          ? 'Produces 2 identical diploid cells'
          : 'Produces 4 genetically unique haploid gametes',
        w / 2,
        h - 14,
        { fontSize: Math.max(10, fs - 2), bold: false },
      )

      // Stage chips + horizontal scrub
      const chipY = h - 72
      const chipH = 22
      const gap = 4
      const chipW = Math.min(88, (w - 24 - gap * (stages.length - 1)) / stages.length)
      const chipsStart = (w - (chipW * stages.length + gap * (stages.length - 1))) / 2
      const chips: ChipHit[] = []

      for (let i = 0; i < stages.length; i++) {
        const x = chipsStart + i * (chipW + gap)
        chips.push({ id: i, x, y: chipY - chipH / 2, w: chipW, h: chipH })
        const short = stages[i].split(' ')[0]
        const isHover = hover === `chip:${i}`
        drawValueChip(ctx, '', short, x + chipW / 2, chipY, {
          fontSize: Math.max(9, fs - 3),
          accent: i === stageIdx || isHover,
        })
      }

      const trackY = h - 44
      const trackX = w * 0.1
      const trackW = w * 0.8
      const trackH = 10
      const handleX = trackX + progress * trackW
      layoutRef.current = {
        scrub: { x: trackX, y: trackY - 10, w: trackW, h: 28 },
        handle: { x: handleX, y: trackY, r: 12 },
        chips,
        stageCount: stages.length,
      }

      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(trackX, trackY - trackH / 2, trackW, trackH)
      ctx.fillStyle = 'rgba(52,152,219,0.55)'
      ctx.fillRect(trackX, trackY - trackH / 2, progress * trackW, trackH)

      const scrubHover = hover === 'scrub'
      drawHoverHalo(ctx, handleX, trackY, 18, scrubHover)
      ctx.beginPath()
      ctx.arc(handleX, trackY, 11, 0, Math.PI * 2)
      ctx.fillStyle = scrubHover ? '#5dade2' : '#3498db'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      if (hintShown.current) {
        drawHint(ctx, 'tap stage chips · drag scrub to jump', w / 2, chipY - 22, w, h, { muted: true })
      }
    },
    [mode, running, stages],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Mitosis vs Meiosis"
      subtitle="Compare chromosome stages and final cell products"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createMitosisMeiosisState()
        setStage(0)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Process">
            <ControlHint>Switch between mitosis and meiosis to compare outcomes.</ControlHint>
            <ControlSelect
              label="Division type"
              value={mode}
              options={[
                { value: 'mitosis', label: 'Mitosis' },
                { value: 'meiosis', label: 'Meiosis' },
              ]}
              onChange={(v) => {
                setMode(v as DivisionMode)
                stateRef.current = createMitosisMeiosisState()
                setStage(0)
                setVersion((n) => n + 1)
              }}
            />
            <ControlSlider
              label="Stage"
              value={stage}
              min={0}
              max={stages.length - 1}
              step={1}
              display={stages[stage] ?? String(stage)}
              onChange={(v) => {
                hintShown.current = false
                applyStage(v)
              }}
            />
          </ControlSection>
          <ControlSection title="Progress">
            <ControlStats>
              <ControlStat label="Stage" value={`${stage + 1} / ${stages.length}`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
