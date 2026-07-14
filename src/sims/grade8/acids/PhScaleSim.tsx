import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect, withShadow } from '../../shared/drawHelpers'
import { drawGlow, SCENE } from '../../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

const SUBSTANCES: { id: string; label: string; ph: number; color: string }[] = [
  // Solute pH / colors from PhET ph-scale Solute.ts
  { id: 'battery', label: 'Battery acid', ph: 1, color: 'rgb(255,255,0)' },
  { id: 'vomit', label: 'Vomit', ph: 2, color: 'rgb(255,171,120)' },
  { id: 'soda', label: 'Soda pop', ph: 2.5, color: 'rgb(204,255,102)' },
  { id: 'oj', label: 'Orange juice', ph: 3.5, color: 'rgb(255,180,0)' },
  { id: 'coffee', label: 'Coffee', ph: 5, color: 'rgb(164,99,7)' },
  { id: 'soup', label: 'Chicken soup', ph: 5.8, color: 'rgb(255,240,104)' },
  { id: 'milk', label: 'Milk', ph: 6.5, color: 'rgb(250,250,250)' },
  { id: 'water', label: 'Water', ph: 7, color: 'rgb(200,220,255)' },
  { id: 'blood', label: 'Blood', ph: 7.4, color: 'rgb(211,79,68)' },
  { id: 'spit', label: 'Spit', ph: 7.4, color: 'rgb(202,240,239)' },
  { id: 'soap', label: 'Hand soap', ph: 10, color: 'rgb(224,141,242)' },
  { id: 'drain', label: 'Drain cleaner', ph: 13, color: 'rgb(255,255,0)' },
]

/** PhET PHScaleConstants.PH_RANGE is −1…15; we expose the same span for custom marker. */
export const PH_RANGE = { min: -1, max: 15 } as const

export function phToColor(ph: number): string {
  const p = Math.max(0, Math.min(14, ph))
  const stops = [
    { at: 0, r: 220, g: 30, b: 30 },
    { at: 3, r: 255, g: 140, b: 0 },
    { at: 6, r: 255, g: 220, b: 0 },
    { at: 7, r: 80, g: 180, b: 80 },
    { at: 9, r: 60, g: 140, b: 220 },
    { at: 12, r: 90, g: 60, b: 200 },
    { at: 14, r: 120, g: 40, b: 160 },
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (p >= a.at && p <= b.at) {
      const t = (p - a.at) / (b.at - a.at)
      return `rgb(${Math.round(a.r + (b.r - a.r) * t)},${Math.round(a.g + (b.g - a.g) * t)},${Math.round(a.b + (b.b - a.b) * t)})`
    }
  }
  return 'rgb(120,40,160)'
}

export interface PhScaleState {
  displayPh: number
  targetPh: number
  time: number
}

export function createPhScaleState(): PhScaleState {
  return { displayPh: 7, targetPh: 7, time: 0 }
}

export function stepPhScale(s: PhScaleState, dt: number, target: number): PhScaleState {
  const diff = target - s.displayPh
  const displayPh = Math.abs(diff) < 0.02 ? target : s.displayPh + diff * Math.min(1, dt * 4)
  return { ...s, displayPh, targetPh: target, time: s.time + dt }
}

function phLabel(ph: number): string {
  if (ph < 6.5) return 'Acidic'
  if (ph > 7.5) return 'Basic (alkaline)'
  return 'Neutral'
}

type Layout = {
  vertical: boolean
  sx: number
  sy: number
  stripW: number
  stripH: number
  mx: number
  my: number
}

export function PhScaleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPhScaleState())
  const paramsRef = useRef({ targetPh: 7 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [substanceId, setSubstanceId] = useState('water')
  const [customPh, setCustomPh] = useState(7)
  const [useCustom, setUseCustom] = useState(false)
  const [version, setVersion] = useState(0)
  const [readoutPh, setReadoutPh] = useState(7)

  const targetPh = useCustom
    ? customPh
    : (SUBSTANCES.find((s) => s.id === substanceId)?.ph ?? 7)
  paramsRef.current.targetPh = targetPh

  const phFromPoint = (pt: { x: number; y: number }) => {
    const L = layoutRef.current
    if (!L) return null
    const span = PH_RANGE.max - PH_RANGE.min
    if (L.vertical) {
      const t = clamp(1 - (pt.y - L.sy) / L.stripH, 0, 1)
      return PH_RANGE.min + t * span
    }
    const t = clamp((pt.x - L.sx) / L.stripW, 0, 1)
    return PH_RANGE.min + t * span
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setReadoutPh(stateRef.current.displayPh)
      if (useCustom) {
        const t = paramsRef.current.targetPh
        if (Math.abs(t - customPh) > 0.05) setCustomPh(Math.round(t * 100) / 100)
      }
    }, 120)
    return () => clearInterval(id)
  }, [customPh, useCustom])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.mx, pt.y - L.my) < 28) return 'marker'
      const inStrip = L.vertical
        ? pt.x >= L.sx - 20 && pt.x <= L.sx + L.stripW + 40 && pt.y >= L.sy && pt.y <= L.sy + L.stripH
        : pt.x >= L.sx && pt.x <= L.sx + L.stripW && pt.y >= L.sy - 20 && pt.y <= L.sy + L.stripH + 50
      return inStrip ? 'scale' : null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (_id, pt) => {
      hintShown.current = false
      const ph = phFromPoint(pt)
      if (ph == null) return
      paramsRef.current.targetPh = ph
      setUseCustom(true)
      setCustomPh(Math.round(ph * 100) / 100)
    },
    onTap: (_id, pt) => {
      const ph = phFromPoint(pt)
      if (ph == null) return
      hintShown.current = false
      paramsRef.current.targetPh = ph
      setUseCustom(true)
      setCustomPh(Math.round(ph * 100) / 100)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const target = paramsRef.current.targetPh
      if (dt > 0 && running) stateRef.current = stepPhScale(stateRef.current, dt, target)
      else stateRef.current.targetPh = target
      const s = stateRef.current
      const ph = s.displayPh
      const fs = fontPx(13, w, h)
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'chemistry')

      const vertical = h > w * 0.85
      const pad = Math.min(w, h) * 0.08
      const stripW = vertical ? Math.min(48, w * 0.12) : Math.min(w * 0.55, 320)
      const stripH = vertical ? Math.min(h * 0.62, 360) : Math.min(36, h * 0.1)
      const sx = vertical ? w * 0.28 : (w - stripW) / 2
      const sy = vertical ? h * 0.14 : h * 0.32

      const grad = vertical
        ? ctx.createLinearGradient(sx, sy + stripH, sx, sy)
        : ctx.createLinearGradient(sx, sy, sx + stripW, sy)
      const phSpan = PH_RANGE.max - PH_RANGE.min
      for (let i = 0; i <= 16; i++) {
        const phVal = PH_RANGE.min + (i / 16) * phSpan
        grad.addColorStop(i / 16, phToColor(phVal))
      }
      withShadow(ctx, () => {
        ctx.fillStyle = grad
        roundRect(ctx, sx, sy, stripW, stripH, 10)
        ctx.fill()
      })
      ctx.strokeStyle = hover === 'scale' || hover === 'marker' ? '#2980b9' : '#2c3e50'
      ctx.lineWidth = hover ? 3 : 2
      roundRect(ctx, sx, sy, stripW, stripH, 10)
      ctx.stroke()

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textBaseline = 'middle'
      for (let i = PH_RANGE.min; i <= PH_RANGE.max; i += 2) {
        const t = (i - PH_RANGE.min) / phSpan
        if (vertical) {
          ctx.textAlign = 'right'
          ctx.fillText(String(i), sx - 10, sy + stripH - t * stripH)
        } else {
          ctx.textAlign = 'center'
          ctx.fillText(String(i), sx + t * stripW, sy - 14)
        }
      }

      if (vertical) {
        drawLabelPill(ctx, 'Acidic', sx - 36, sy + stripH - 4, { fontSize: Math.max(9, fs - 3), align: 'right' })
        drawLabelPill(ctx, 'Neutral', sx - 36, sy + stripH / 2, { fontSize: Math.max(9, fs - 3), align: 'right' })
        drawLabelPill(ctx, 'Basic', sx - 36, sy + 4, { fontSize: Math.max(9, fs - 3), align: 'right' })
      } else {
        drawLabelPill(ctx, 'Acidic', sx, sy - 36, { fontSize: Math.max(9, fs - 2), align: 'left' })
        drawLabelPill(ctx, 'Neutral', sx + stripW / 2, sy - 36, { fontSize: Math.max(9, fs - 2) })
        drawLabelPill(ctx, 'Basic', sx + stripW, sy - 36, { fontSize: Math.max(9, fs - 2), align: 'right' })
      }

      const markerT = (clamp(ph, PH_RANGE.min, PH_RANGE.max) - PH_RANGE.min) / phSpan
      const mx = vertical ? sx + stripW / 2 : sx + markerT * stripW
      const my = vertical ? sy + stripH - markerT * stripH : sy + stripH / 2
      drawHoverHalo(ctx, mx, my, 22, hover === 'marker' || hover === 'scale')
      if (hover === 'marker' || hover === 'scale') {
        drawGlow(ctx, mx, my, 28, SCENE.chemistry.hot, 0.35)
      }
      ctx.save()
      ctx.strokeStyle = '#1a252f'
      ctx.fillStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      if (vertical) {
        ctx.moveTo(sx + stripW + 8, my)
        ctx.lineTo(sx + stripW + 28, my)
        ctx.arc(mx + (stripW / 2 + 36), my, hover === 'marker' ? 12 : 10, 0, Math.PI * 2)
      } else {
        ctx.moveTo(mx, sy + stripH + 8)
        ctx.lineTo(mx, sy + stripH + 28)
        ctx.arc(mx, sy + stripH + 38, hover === 'marker' ? 12 : 10, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      const chipX = vertical ? mx + stripW / 2 + 70 : mx
      const chipY = vertical ? my : sy + stripH + 58
      drawValueChip(ctx, 'pH', ph.toFixed(2), chipX, chipY, { fontSize: fs, accent: true })

      layoutRef.current = { vertical, sx, sy, stripW, stripH, mx: vertical ? mx + stripW / 2 + 36 : mx, my: vertical ? my : sy + stripH + 38 }

      const indW = vertical ? stripW * 0.55 : 140
      const indH = vertical ? 120 : 28
      const ix = vertical ? sx + stripW + 56 : w - pad - indW
      const iy = vertical ? sy + stripH * 0.35 : sy + stripH + 78
      ctx.fillStyle = '#ecf0f1'
      roundRect(ctx, ix, iy, indW, indH, 6)
      ctx.fill()
      ctx.fillStyle = phToColor(ph)
      roundRect(ctx, ix + 6, iy + 6, indW - 12, indH - 12, 4)
      ctx.fill()
      drawLabelPill(ctx, 'Indicator', ix + indW / 2, iy + indH + 14, { fontSize: Math.max(10, fs - 1) })

      drawLabelPill(ctx, `${phLabel(ph)}`, w / 2, h - 44, { fontSize: fs + 1 })
      if (hintShown.current) drawHint(ctx, 'drag marker along the scale', w / 2, h - 16, w, h)
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="pH Scale"
      subtitle="PhET-inspired solute list and pH values"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPhScaleState()
        paramsRef.current.targetPh = 7
        setSubstanceId('water')
        setCustomPh(7)
        setUseCustom(false)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Substance">
            <ControlHint>Drag the marker on the scale, or pick a substance.</ControlHint>
            <ControlSelect
              label="Sample"
              value={useCustom ? 'custom' : substanceId}
              options={[
                ...SUBSTANCES.map((s) => ({ value: s.id, label: s.label })),
                { value: 'custom', label: 'Custom pH…' },
              ]}
              onChange={(v) => {
                if (v === 'custom') setUseCustom(true)
                else {
                  setUseCustom(false)
                  setSubstanceId(v)
                  const ph = SUBSTANCES.find((s) => s.id === v)?.ph ?? 7
                  paramsRef.current.targetPh = ph
                }
              }}
            />
            {useCustom && (
              <ControlSlider
                label="Custom pH"
                value={customPh}
                min={PH_RANGE.min}
                max={PH_RANGE.max}
                step={0.01}
                display={customPh.toFixed(2)}
                onChange={(v) => {
                  setCustomPh(v)
                  paramsRef.current.targetPh = v
                }}
              />
            )}
          </ControlSection>
          <ControlSection title="Reading">
            <ControlStats>
              <ControlStat label="pH" value={readoutPh.toFixed(2)} />
              <ControlStat label="Nature" value={phLabel(readoutPh)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
