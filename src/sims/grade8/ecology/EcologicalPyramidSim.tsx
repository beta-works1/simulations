import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
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
  DECOMPOSER_LABEL,
  PYRAMID_COLORS,
  PYRAMID_LABELS,
  createPyramidState,
  formatTierValue,
  modeUnit,
  stepPyramid,
  tierDetail,
  tierDotCount,
  tierValues,
  type PyramidMode,
} from './ecologicalPyramidModel'
import { TROPHIC_LEVELS } from './foodWebGuide'

type TierLayout = { id: number; x: number; y: number; w: number; h: number; cx: number; cy: number }

type Layout = {
  tiers: TierLayout[]
  decomposer: { x: number; y: number; w: number; h: number }
  baseHandle: { x: number; y: number; r: number }
}

function drawSun(ctx: CanvasRenderingContext2D, cx: number, y: number, pulse: number) {
  const r = 16 + Math.sin(pulse * 2) * 2
  const g = ctx.createRadialGradient(cx, y, 0, cx, y, r * 2.5)
  g.addColorStop(0, 'rgba(255,220,80,0.6)')
  g.addColorStop(1, 'rgba(255,180,40,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, y, r * 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#f4d03f'
  ctx.fill()
}

function drawTierDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  midY: number,
  hw: number,
  bandH: number,
  count: number,
  color: string,
) {
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  const spacing = Math.min(hw * 1.2 / cols, bandH * 0.55 / rows)
  let drawn = 0
  for (let row = 0; row < rows && drawn < count; row++) {
    for (let col = 0; col < cols && drawn < count; col++) {
      const x = cx - ((cols - 1) * spacing) / 2 + col * spacing
      const y = midY - ((rows - 1) * spacing) / 2 + row * spacing + bandH * 0.08
      ctx.beginPath()
      ctx.arc(x, y, Math.max(2, spacing * 0.22), 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = 0.55
      ctx.fill()
      ctx.globalAlpha = 1
      drawn++
    }
  }
}

export function EcologicalPyramidSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPyramidState())
  const paramsRef = useRef({ base: 10000, selectedTier: 0, mode: 'energy' as PyramidMode })
  const layoutRef = useRef<Layout>({
    tiers: [],
    decomposer: { x: 0, y: 0, w: 0, h: 0 },
    baseHandle: { x: 0, y: 0, r: 14 },
  })
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [base, setBase] = useState(10000)
  const [selectedTier, setSelectedTier] = useState(0)
  const [mode, setMode] = useState<PyramidMode>('energy')
  const [version, setVersion] = useState(0)

  paramsRef.current = { base, selectedTier, mode }

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const L = layoutRef.current
      const h = L.baseHandle
      if (Math.hypot(pt.x - h.x, pt.y - h.y) < h.r + 10) return 'base-handle'
      const d = L.decomposer
      if (pt.x >= d.x && pt.x <= d.x + d.w && pt.y >= d.y && pt.y <= d.y + d.h) return 'decomposer'
      for (const t of L.tiers) {
        if (pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h) return `tier:${t.id}`
      }
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
      const values = tierValues(p.base, p.mode)
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)
      const narrow = w < 520

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0e2433')
      bg.addColorStop(1, '#1a3324')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const vg = ctx.createRadialGradient(w * 0.5, h * 0.4, Math.min(w, h) * 0.15, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
      vg.addColorStop(0, 'rgba(255,255,255,0.04)')
      vg.addColorStop(1, 'rgba(0,0,0,0.18)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      drawSun(ctx, w / 2, h * 0.05, stateRef.current.pulse)

      const top = h * 0.1
      const bottom = h * (narrow ? 0.72 : 0.76)
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

        layoutRef.current.tiers.push({
          id: i,
          x: cx - hw,
          y: y + 10,
          w: hw * 2,
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

        const dots = tierDotCount(p.base, i, p.mode)
        drawTierDots(ctx, cx, midY, hw * 0.65, band, dots, '#fff')

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
        fillFittedText(ctx, PYRAMID_LABELS[i], cx, midY - band * 0.12, Math.max(40, hw * 1.2), nameFs, {
          minPx: 9,
          align: 'center',
          baseline: 'middle',
        })
        ctx.restore()

        const energyX = narrow ? cx : Math.min(w - 12, cx + hw * 0.85 + 8)
        const energyY = narrow ? y + band - 4 : midY + band * 0.18
        drawValueChip(ctx, narrow ? '' : '', formatTierValue(values[i], p.mode), energyX, energyY, {
          align: narrow ? 'center' : 'left',
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })

        // Energy loss particles between tiers
        if (running && i < levels - 1 && p.mode === 'energy') {
          const lossY = y + band
          const phase = (stateRef.current.pulse * 0.8 + i) % 1
          for (let k = 0; k < 3; k++) {
            const lx = cx + (k - 1) * hw * 0.25
            const ly = lossY + phase * band * 0.5 + k * 8
            ctx.beginPath()
            ctx.arc(lx, ly, 2.5, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(231,76,60,0.5)'
            ctx.fill()
          }
          if (i === 0) {
            drawLabelPill(ctx, '~90% lost as heat', cx, lossY + band * 0.15, {
              fontSize: Math.max(8, fs - 3),
              bold: false,
              bg: 'rgba(231,76,60,0.35)',
              fg: '#fff',
            })
          }
        }
      }

      // Decomposer band
      const decoY = bottom + 6
      const decoH = h * (narrow ? 0.1 : 0.08)
      const decoW = w * 0.7
      const decoX = (w - decoW) / 2
      layoutRef.current.decomposer = { x: decoX, y: decoY, w: decoW, h: decoH }
      const decoHover = hover === 'decomposer'
      ctx.fillStyle = decoHover ? 'rgba(142,68,173,0.55)' : 'rgba(142,68,173,0.4)'
      ctx.beginPath()
      ctx.roundRect(decoX, decoY, decoW, decoH, 6)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `600 ${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(DECOMPOSER_LABEL, w / 2, decoY + decoH / 2 + 4)
      ctx.textAlign = 'left'
      ctx.font = `400 ${Math.max(9, fs - 2)}px Roboto, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText('Recycle nutrients → back to producers', w / 2, decoY + decoH + 14)

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
      drawValueChip(ctx, 'Base', formatTierValue(p.base, p.mode), handleX, handleY - (narrow ? 22 : 28), {
        fontSize: Math.max(10, fs - 1),
        accent: true,
        align: 'center',
      })

      if (hintShown.current) {
        drawHint(
          ctx,
          narrow ? 'tap tiers · switch pyramid type · drag handle' : 'click tiers · ~10% energy up each level',
          w / 2,
          h - 12,
          w,
          h,
          { muted: true },
        )
      }
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  const detail = tierDetail(base, selectedTier, mode)

  return (
    <SimShell
      title="Ecological Pyramid"
      subtitle="Energy, biomass, and numbers shrink at each trophic level"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPyramidState()
        paramsRef.current = { base: 10000, selectedTier: 0, mode: 'energy' }
        setBase(10000)
        setSelectedTier(0)
        setMode('energy')
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Pyramid type">
            <ControlSelect
              label="Show"
              value={mode}
              options={[
                { value: 'energy', label: 'Energy (10% rule)' },
                { value: 'biomass', label: 'Biomass (kg)' },
                { value: 'numbers', label: 'Organism count' },
              ]}
              onChange={(v) => {
                setMode(v as PyramidMode)
                paramsRef.current.mode = v as PyramidMode
                setVersion((n) => n + 1)
              }}
            />
            <ControlHint>
              Dots inside each tier represent relative {modeUnit(mode)}. Fewer organisms at higher levels.
            </ControlHint>
          </ControlSection>

          <ControlSection title="Selected tier">
            <ControlStats>
              <ControlStat label="Level" value={detail.label} />
              <ControlStat label={modeUnit(mode)} value={formatTierValue(detail.energy, mode)} />
              {mode === 'energy' ? (
                <ControlStat label="% of base" value={`${detail.pctOfBase.toFixed(detail.pctOfBase < 1 ? 2 : 1)}%`} />
              ) : null}
              {mode === 'numbers' ? (
                <ControlStat label="Organisms" value={String(detail.organisms)} />
              ) : null}
              {mode === 'biomass' ? (
                <ControlStat label="Biomass" value={`${Math.round(detail.biomass)} kg`} />
              ) : null}
              {selectedTier > 0 && mode === 'energy' ? (
                <>
                  <ControlStat label="From level below" value={`${detail.pctFromBelow.toFixed(1)}%`} />
                  <ControlStat label="Lost as heat" value={`${detail.lostFromBelow.toFixed(0)}%`} />
                </>
              ) : null}
            </ControlStats>
          </ControlSection>

          <ControlSection title="Energy base">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <InfoTooltip title={TROPHIC_LEVELS.title}>
                <p>{TROPHIC_LEVELS.body}</p>
              </InfoTooltip>
              <strong style={{ fontSize: 13 }}>Trophic levels</strong>
            </div>
            <ControlSlider
              label="Producer level"
              value={base}
              min={1000}
              max={50000}
              step={500}
              display={formatTierValue(base, mode)}
              onChange={(v) => {
                setBase(v)
                paramsRef.current.base = v
              }}
            />
          </ControlSection>

          <ControlSection title="Compare levels">
            <ControlStats>
              {PYRAMID_LABELS.map((label, i) => (
                <ControlStat
                  key={label}
                  label={label}
                  value={formatTierValue(tierValues(base, mode)[i], mode)}
                />
              ))}
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
