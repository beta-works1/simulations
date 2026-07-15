import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, withShadow } from '../../shared/drawHelpers'
import { drawGlow, SCENE } from '../../shared/canvasTheme'
import { drawHint, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  PLASMID_STAGES,
  createPlasmidState,
  plasmidStageProgress,
  setPlasmidStage,
  stepPlasmid,
} from './plasmidInsertionModel'

type ChipHit = { id: number; x: number; y: number; w: number; h: number }

type Layout = {
  strip: { x: number; y: number; w: number; h: number }
  chips: ChipHit[]
}

export function PlasmidInsertionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPlasmidState())
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const scrubbingRef = useRef(false)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [version, setVersion] = useState(0)
  const [stage, setStage] = useState(0)
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
    const clamped = clamp(Math.round(next), 0, PLASMID_STAGES.length - 1)
    stateRef.current = setPlasmidStage(stateRef.current, clamped)
    setStage(clamped)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      for (const c of L.chips) {
        if (pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h) return `chip:${c.id}`
      }
      const s = L.strip
      if (pt.x >= s.x && pt.x <= s.x + s.w && pt.y >= s.y && pt.y <= s.y + s.h) return 'strip'
      return null
    },
    cursorForHit: () => 'pointer',
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDragStart: (id) => {
      if (id === 'strip' || id.startsWith('chip:')) scrubbingRef.current = true
    },
    onDragEnd: () => {
      scrubbingRef.current = false
    },
    onDrag: (id, pt) => {
      const L = layoutRef.current
      if (!L || id !== 'strip') return
      hintShown.current = false
      const t = clamp((pt.x - L.strip.x) / L.strip.w, 0, 1)
      applyStage(t * (PLASMID_STAGES.length - 1))
    },
    onTap: (id, pt) => {
      if (!id) return
      hintShown.current = false
      if (id.startsWith('chip:')) {
        applyStage(Number(id.slice(5)))
        return
      }
      if (id === 'strip') {
        const L = layoutRef.current
        if (!L) return
        const t = clamp((pt.x - L.strip.x) / L.strip.w, 0, 1)
        applyStage(t * (PLASMID_STAGES.length - 1))
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const advancing = running && !scrubbingRef.current
      const prev = stateRef.current.stage
      stateRef.current = stepPlasmid(stateRef.current, dt, advancing)
      if (stateRef.current.stage !== prev) setStage(stateRef.current.stage)
      const stageIdx = stateRef.current.stage
      const f = plasmidStageProgress(stateRef.current)
      const fs = fontPx(13, w, h)
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'biotech')

      const cx = w * 0.34
      const cy = h * 0.46
      const ringR = Math.min(w, h) * 0.14

      withShadow(ctx, () => {
        ctx.strokeStyle = '#58d68d'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.stroke()
      })

      const gap = stageIdx === 0 ? f * 0.4 : stageIdx > 0 ? 0.4 : 0
      if (gap > 0) {
        ctx.strokeStyle = '#102a20'
        ctx.lineWidth = 12
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, -gap, gap)
        ctx.stroke()
      }

      const geneX = stageIdx < 1 ? w * 0.74 : cx + ringR * Math.cos(-0.2)
      const geneY = stageIdx < 1 ? h * 0.28 : cy
      drawGlow(ctx, geneX, geneY, 52, SCENE.biotech.hot, 0.38)
      ctx.fillStyle = '#f4d03f'
      ctx.fillRect(geneX - 42, geneY - 9, 84, 18)
      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Target gene', geneX, geneY - 16)

      if (stageIdx >= 2) {
        ctx.strokeStyle = '#f4d03f'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, -0.35, 0.35)
        ctx.stroke()
      }

      const bx = w * 0.74
      const by = h * 0.62
      ctx.beginPath()
      ctx.ellipse(bx, by, Math.min(w, h) * 0.12, Math.min(w, h) * 0.07, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1abc9c'
      ctx.fill()
      ctx.fillStyle = '#0e6655'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.fillText('Bacterium', bx, by + 4)

      if (stageIdx >= 3) {
        const px = stageIdx === 3 ? cx + (bx - cx) * f : bx
        const py = stageIdx === 3 ? cy + (by - cy) * f : by
        ctx.strokeStyle = '#58d68d'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(px, py, 20, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = '#f4d03f'
        ctx.beginPath()
        ctx.arc(px, py, 20, -0.35, 0.35)
        ctx.stroke()
      }

      if (stageIdx >= 4) {
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = '#58d68d'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(bx - 42 + i * 42, by - 52 - Math.sin(f * Math.PI + i) * 8, 13, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      drawLabelPill(ctx, `Step ${stageIdx + 1}: ${PLASMID_STAGES[stageIdx]}`, 16, 26, {
        align: 'left',
        fontSize: fs + 1,
      })

      // Step strip / chips
      const stripY = h - 40
      const stripX = w * 0.08
      const stripW = w * 0.84
      const chipH = 26
      const gapX = 4
      const chipW = (stripW - gapX * (PLASMID_STAGES.length - 1)) / PLASMID_STAGES.length
      const chips: ChipHit[] = []

      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(stripX - 4, stripY - chipH / 2 - 4, stripW + 8, chipH + 8)

      for (let i = 0; i < PLASMID_STAGES.length; i++) {
        const x = stripX + i * (chipW + gapX)
        chips.push({ id: i, x, y: stripY - chipH / 2, w: chipW, h: chipH })
        const isHover = hover === `chip:${i}` || (hover === 'strip' && i === stageIdx)
        drawValueChip(ctx, '', String(i + 1), x + chipW / 2, stripY, {
          fontSize: Math.max(10, fs - 2),
          accent: i === stageIdx || isHover,
        })
      }

      layoutRef.current = {
        strip: { x: stripX - 4, y: stripY - chipH / 2 - 4, w: stripW + 8, h: chipH + 8 },
        chips,
      }

      if (hintShown.current) {
        drawHint(ctx, 'tap a step chip to jump', w / 2, stripY - 28, w, h, { muted: true })
      }
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Genetic Engineering"
      subtitle="Plasmid cut → gene insert → bacterial transformation"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPlasmidState()
        setStage(0)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Process">
            <ControlHint>
              Follow restriction cut, insert, ligation, transformation, then copies.
            </ControlHint>
            <ControlSlider
              label="Step"
              value={stage}
              min={0}
              max={PLASMID_STAGES.length - 1}
              step={1}
              display={PLASMID_STAGES[stage]}
              onChange={(v) => {
                hintShown.current = false
                applyStage(v)
              }}
            />
            <ControlStats>
              <ControlStat label="Step" value={`${stage + 1} / ${PLASMID_STAGES.length}`} />
              <ControlStat label="Current" value={PLASMID_STAGES[stage]} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
