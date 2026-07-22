import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
  InfoTooltip,
} from '../../shared/Controls'
import { fillFittedText, fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  PYRAMID_COLORS,
  PYRAMID_LABELS,
  createPyramidState,
  formatEnergy,
  stepPyramid,
  tierDetail,
  tierEnergies,
} from './ecologicalPyramidModel'
import { TROPHIC_LEVELS } from './foodWebGuide'

type TierLayout = { id: number; x: number; y: number; w: number; h: number; cx: number; cy: number }

type Layout = {
  tiers: TierLayout[]
  baseHandle: { x: number; y: number; r: number }
}

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

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const L = layoutRef.current
      const h = L.baseHandle
      if (Math.hypot(pt.x - h.x, pt.y - h.y) < h.r + 10) return 'base-handle'
      for (const t of L.tiers) {
        if (pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h) return `tier:${t.id}`
      }
      // Base drag zone along bottom on narrow screens
      if (size.w < 520 && pt.y > size.h * 0.88) return 'base-strip'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      if (id.startsWith('tier:')) {
        const tier = Number(id.slice(5))
        paramsRef.current.selectedTier = tier
        setSelectedTier(tier)
      }
    },
    onDrag: (id, pt, size) => {
      if (id !== 'base-handle' && id !== 'base-strip') return
      hintShown.current = false
      const t = clamp((size.h - pt.y) / (size.h * 0.75), 0, 1)
      const next = Math.round(1000 + t * 49000)
      paramsRef.current.base = next
      setBase(next)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      stateRef.current = stepPyramid(stateRef.current, dt, running)
      const p = paramsRef.current
      stateRef.current.baseEnergy = p.base
      const E = tierEnergies(p.base)
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)
      const narrow = w < 520

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0e2433')
      bg.addColorStop(1, '#1a3324')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const vg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.4,
        Math.min(w, h) * 0.15,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      )
      vg.addColorStop(0, 'rgba(255,255,255,0.04)')
      vg.addColorStop(1, 'rgba(0,0,0,0.18)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      const top = h * 0.1
      const bottom = h * (narrow ? 0.78 : 0.82)
      const levels = 4
      const band = (bottom - top) / levels

      layoutRef.current.tiers = []

      for (let i = 0; i < levels; i++) {
        const t = i / (levels - 1)
        const widthFrac = 0.28 + (1 - t) * 0.55
        const hw = (w * widthFrac) / 2
        const y = top + i * band
        const cx = w / 2
        const midY = y + band / 2
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
          cy: midY,
        })

        drawHoverHalo(ctx, cx, midY, hw * 0.85, isHover && !isSel)

        ctx.beginPath()
        ctx.moveTo(cx - hw, y + band - 10)
        ctx.lineTo(cx + hw, y + band - 10)
        ctx.lineTo(cx + hw * 0.72, y + 10)
        ctx.lineTo(cx - hw * 0.72, y + 10)
        ctx.closePath()
        ctx.fillStyle = PYRAMID_COLORS[i]
        ctx.globalAlpha = isSel ? 1 : isHover ? 0.95 : 0.88 + 0.08 * Math.sin(stateRef.current.pulse * 2 + i)
        ctx.fill()
        ctx.globalAlpha = 1
        if (isSel || isHover) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = isSel ? 3 : 2
          ctx.stroke()
        }

        const nameFs = Math.max(11, Math.min(fs + 1, Math.floor(band * 0.32)))
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = 4
        ctx.fillStyle = '#fff'
        ctx.font = `700 ${nameFs}px Roboto, sans-serif`
        fillFittedText(ctx, PYRAMID_LABELS[i], cx, midY, Math.max(40, hw * 1.2), nameFs, {
          minPx: 9,
          align: 'center',
          baseline: 'middle',
        })
        ctx.restore()

        const energyX = narrow
          ? cx
          : Math.min(w - 12, cx + hw * 0.85 + 8)
        const energyY = narrow ? y + band - 4 : midY
        drawValueChip(ctx, narrow ? '' : '', formatEnergy(E[i]), energyX, energyY, {
          align: narrow ? 'center' : 'left',
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })
      }

      const handleX = narrow ? w * 0.5 : w * 0.9
      const handleY = narrow ? h * 0.92 : h * 0.5
      layoutRef.current.baseHandle = { x: handleX, y: handleY, r: 14 }
      const handleHover = hover === 'base-handle' || hover === 'base-strip'
      drawHoverHalo(ctx, handleX, handleY, 20, handleHover)
      ctx.beginPath()
      ctx.arc(handleX, handleY, 14, 0, Math.PI * 2)
      ctx.fillStyle = handleHover ? '#3498db' : '#2980b9'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      drawValueChip(ctx, 'Base', formatEnergy(p.base), handleX, handleY - (narrow ? 22 : 28), {
        fontSize: Math.max(10, fs - 1),
        accent: true,
        align: 'center',
      })

      if (hintShown.current) {
        drawHint(
          ctx,
          narrow
            ? 'tap tiers · drag blue handle · ~10% up each level'
            : 'click tiers · drag handle · ~10% energy up each level',
          w / 2,
          h - 16,
          w,
          h,
          { muted: true },
        )
      } else {
        drawLabelPill(ctx, '~10% energy passes up each level', w / 2, h - 16, {
          fontSize: Math.max(10, fs - 1),
          bg: 'rgba(0,0,0,0.45)',
          fg: '#ecf0f1',
          bold: false,
        })
      }
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  const detail = tierDetail(base, selectedTier)

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
          <ControlSection title="Selected tier">
            <ControlStats>
              <ControlStat label="Level" value={detail.label} />
              <ControlStat label="Energy" value={formatEnergy(detail.energy)} />
              <ControlStat label="% of base" value={`${detail.pctOfBase.toFixed(detail.pctOfBase < 1 ? 2 : 1)}%`} />
              {selectedTier > 0 ? (
                <>
                  <ControlStat
                    label="From level below"
                    value={`${detail.pctFromBelow.toFixed(1)}%`}
                  />
                  <ControlStat label="Lost as heat" value={`${detail.lostFromBelow.toFixed(0)}%`} />
                </>
              ) : null}
            </ControlStats>
            <ControlHint>Tap a tier on the pyramid to inspect it.</ControlHint>
          </ControlSection>

          <ControlSection title="Energy base">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <InfoTooltip title={TROPHIC_LEVELS.title}>
                <p>{TROPHIC_LEVELS.body}</p>
              </InfoTooltip>
              <strong style={{ fontSize: 13 }}>Trophic levels</strong>
            </div>
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
              <ControlStat label="Producers" value={formatEnergy(base)} />
              <ControlStat label="Primary" value={formatEnergy(base * 0.1)} />
              <ControlStat label="Top predator" value={formatEnergy(base * 0.001)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
