import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

export function createPyramidState() {
  return { baseEnergy: 10000, pulse: 0 }
}

type TierLayout = { id: number; x: number; y: number; w: number; h: number; cx: number; cy: number }

type Layout = {
  tiers: TierLayout[]
  baseHandle: { x: number; y: number; r: number }
}

const LABELS = ['Producers', 'Primary consumers', 'Secondary', 'Tertiary']
const COLORS = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b']

export function EcologicalPyramidSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPyramidState())
  const paramsRef = useRef({ base: 10000, selectedTier: 0 })
  const layoutRef = useRef<Layout>({ tiers: [], baseHandle: { x: 0, y: 0, r: 14 } })
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [base, setBase] = useState(10000)
  const [selectedTier, setSelectedTier] = useState(0)
  const [version, setVersion] = useState(0)

  paramsRef.current = { base, selectedTier }

  useEffect(() => {
    const id = window.setInterval(() => {
      setBase(paramsRef.current.base)
      setSelectedTier(paramsRef.current.selectedTier)
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      const h = L.baseHandle
      if (Math.hypot(pt.x - h.x, pt.y - h.y) < h.r + 10) return 'base-handle'
      for (const t of L.tiers) {
        if (pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h) return `tier:${t.id}`
      }
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      if (id.startsWith('tier:')) {
        paramsRef.current.selectedTier = Number(id.slice(5))
        setSelectedTier(paramsRef.current.selectedTier)
      }
    },
    onDrag: (id, pt, size) => {
      if (id !== 'base-handle') return
      hintShown.current = false
      const t = clamp((size.h - pt.y) / (size.h * 0.7), 0, 1)
      paramsRef.current.base = Math.round(1000 + t * 49000)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current.pulse += dt
      const p = paramsRef.current
      stateRef.current.baseEnergy = p.base
      const E = [p.base, p.base * 0.1, p.base * 0.01, p.base * 0.001]
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0e2433')
      bg.addColorStop(1, '#1a3324')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const top = h * 0.1
      const bottom = h * 0.82
      const levels = 4
      const band = (bottom - top) / levels

      layoutRef.current.tiers = []

      for (let i = 0; i < levels; i++) {
        const t = i / (levels - 1)
        const widthFrac = 0.28 + (1 - t) * 0.55
        const hw = (w * widthFrac) / 2
        const y = top + i * band
        const cx = w / 2
        const isSel = p.selectedTier === i
        const isHover = hover === `tier:${i}`

        const left = cx - hw
        const tierW = hw * 2
        layoutRef.current.tiers.push({
          id: i,
          x: left,
          y: y + 10,
          w: tierW,
          h: band - 10,
          cx,
          cy: y + band / 2,
        })

        drawHoverHalo(ctx, cx, y + band / 2, hw * 0.85, isHover && !isSel)

        ctx.beginPath()
        ctx.moveTo(cx - hw, y + band - 10)
        ctx.lineTo(cx + hw, y + band - 10)
        ctx.lineTo(cx + hw * 0.72, y + 10)
        ctx.lineTo(cx - hw * 0.72, y + 10)
        ctx.closePath()
        ctx.fillStyle = COLORS[i]
        ctx.globalAlpha = isSel ? 1 : isHover ? 0.95 : 0.88 + 0.08 * Math.sin(stateRef.current.pulse * 2 + i)
        ctx.fill()
        ctx.globalAlpha = 1
        if (isSel || isHover) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = isSel ? 3 : 2
          ctx.stroke()
        }

        drawLabelPill(ctx, LABELS[i], cx, y + band / 2 - fs * 0.35, {
          fontSize: fs,
          bg: 'rgba(0,0,0,0.35)',
          fg: '#fff',
        })
        drawValueChip(ctx, 'Energy', `${formatEnergy(E[i])} units`, cx, y + band / 2 + fs * 0.65, {
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })
      }

      const handleX = w * 0.92
      const handleY = h * 0.5
      layoutRef.current.baseHandle = { x: handleX, y: handleY, r: 14 }
      const handleHover = hover === 'base-handle'
      drawHoverHalo(ctx, handleX, handleY, 20, handleHover)
      ctx.beginPath()
      ctx.arc(handleX, handleY, 14, 0, Math.PI * 2)
      ctx.fillStyle = handleHover ? '#3498db' : '#2980b9'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      drawValueChip(ctx, 'Base', formatEnergy(p.base), handleX, handleY + 28, { fontSize: fs, accent: true })

      drawLabelPill(ctx, '~10% energy passes up each level', w / 2, h - 18, {
        fontSize: Math.max(10, fs - 1),
        bg: 'rgba(0,0,0,0.55)',
        fg: '#ecf0f1',
        bold: false,
      })

      if (hintShown.current) {
        drawHint(ctx, 'click tiers · drag handle for base energy', w / 2, h - 42, w, h, { muted: true })
      }
    },
    [base, running, selectedTier],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Ecological Pyramid"
      subtitle="The 10% rule — energy shrinks at each trophic level"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPyramidState()
        paramsRef.current = { base: 10000, selectedTier: 0 }
        setBase(10000)
        setSelectedTier(0)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Energy base">
            <ControlHint>Only about 10% of energy moves to the next level; the rest is lost as heat.</ControlHint>
            <ControlSlider
              label="Producer energy"
              value={base}
              min={1000}
              max={50000}
              step={500}
              display={formatEnergy(base)}
              onChange={(v) => {
                setBase(v)
                paramsRef.current.base = v
              }}
            />
          </ControlSection>
          <ControlSection title="Outcomes">
            <ControlStats>
              <ControlStat label="Base" value={formatEnergy(base)} />
              <ControlStat label="Top predator" value={formatEnergy(base * 0.001)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}

function formatEnergy(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
}
