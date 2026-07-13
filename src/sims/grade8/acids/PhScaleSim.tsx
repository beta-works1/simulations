import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

const SUBSTANCES: { id: string; label: string; ph: number }[] = [
  { id: 'battery', label: 'Battery acid (~0)', ph: 0.5 },
  { id: 'lemon', label: 'Lemon juice (~2)', ph: 2 },
  { id: 'vinegar', label: 'Vinegar (~3)', ph: 3 },
  { id: 'coffee', label: 'Coffee (~5)', ph: 5 },
  { id: 'water', label: 'Pure water (7)', ph: 7 },
  { id: 'blood', label: 'Blood (~7.4)', ph: 7.4 },
  { id: 'soap', label: 'Soap solution (~9)', ph: 9 },
  { id: 'ammonia', label: 'Ammonia (~11)', ph: 11 },
  { id: 'bleach', label: 'Bleach (~12)', ph: 12 },
  { id: 'drain', label: 'Drain cleaner (~14)', ph: 14 },
]

/** Map pH 0–14 to indicator color (red → yellow → green → blue → purple). */
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
      const r = Math.round(a.r + (b.r - a.r) * t)
      const g = Math.round(a.g + (b.g - a.g) * t)
      const bl = Math.round(a.b + (b.b - a.b) * t)
      return `rgb(${r},${g},${bl})`
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

export function PhScaleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPhScaleState())
  const [running, setRunning] = useState(true)
  const [substanceId, setSubstanceId] = useState('water')
  const [customPh, setCustomPh] = useState(7)
  const [useCustom, setUseCustom] = useState(false)
  const [version, setVersion] = useState(0)
  const [readoutPh, setReadoutPh] = useState(7)

  const targetPh = useCustom
    ? customPh
    : (SUBSTANCES.find((s) => s.id === substanceId)?.ph ?? 7)

  useEffect(() => {
    const id = window.setInterval(() => setReadoutPh(stateRef.current.displayPh), 120)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current = stepPhScale(stateRef.current, dt, targetPh)
      else stateRef.current.targetPh = targetPh
      const s = stateRef.current
      const ph = s.displayPh
      const fs = fontPx(13, w, h)

      ctx.fillStyle = '#f7f9fb'
      ctx.fillRect(0, 0, w, h)

      const vertical = h > w * 0.85
      const pad = Math.min(w, h) * 0.08
      const stripW = vertical ? Math.min(48, w * 0.12) : Math.min(w * 0.55, 320)
      const stripH = vertical ? Math.min(h * 0.62, 360) : Math.min(36, h * 0.1)
      const sx = vertical ? w * 0.28 : (w - stripW) / 2
      const sy = vertical ? h * 0.14 : h * 0.32

      const grad = vertical
        ? ctx.createLinearGradient(sx, sy + stripH, sx, sy)
        : ctx.createLinearGradient(sx, sy, sx + stripW, sy)
      for (let i = 0; i <= 14; i++) grad.addColorStop(i / 14, phToColor(i))
      ctx.fillStyle = grad
      roundRect(ctx, sx, sy, stripW, stripH, 10)
      ctx.fill()
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 2
      roundRect(ctx, sx, sy, stripW, stripH, 10)
      ctx.stroke()

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i <= 14; i += 2) {
        const t = i / 14
        if (vertical) {
          const y = sy + stripH - t * stripH
          ctx.textAlign = 'right'
          ctx.fillText(String(i), sx - 10, y)
        } else {
          const x = sx + t * stripW
          ctx.textAlign = 'center'
          ctx.fillText(String(i), x, sy - 14)
        }
      }

      const markerT = ph / 14
      const mx = vertical ? sx + stripW / 2 : sx + markerT * stripW
      const my = vertical ? sy + stripH - markerT * stripH : sy + stripH / 2
      ctx.save()
      ctx.strokeStyle = '#1a252f'
      ctx.fillStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      if (vertical) {
        ctx.moveTo(sx + stripW + 8, my)
        ctx.lineTo(sx + stripW + 28, my)
        ctx.arc(mx + (stripW / 2 + 36), my, 10, 0, Math.PI * 2)
      } else {
        ctx.moveTo(mx, sy + stripH + 8)
        ctx.lineTo(mx, sy + stripH + 28)
        ctx.arc(mx, sy + stripH + 38, 10, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      const indW = vertical ? stripW * 0.55 : 140
      const indH = vertical ? 120 : 28
      const ix = vertical ? sx + stripW + 56 : w - pad - indW
      const iy = vertical ? sy + stripH * 0.35 : sy + stripH + 64
      ctx.fillStyle = '#ecf0f1'
      roundRect(ctx, ix, iy, indW, indH, 6)
      ctx.fill()
      ctx.strokeStyle = '#95a5a6'
      ctx.lineWidth = 1.5
      roundRect(ctx, ix, iy, indW, indH, 6)
      ctx.stroke()
      ctx.fillStyle = phToColor(ph)
      const innerPad = 6
      roundRect(ctx, ix + innerPad, iy + innerPad, indW - innerPad * 2, indH - innerPad * 2, 4)
      ctx.fill()
      ctx.fillStyle = '#1a252f'
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = vertical ? 'left' : 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('Indicator strip', ix, iy + indH + 8)

      const sub = SUBSTANCES.find((x) => x.id === substanceId)
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`pH ${ph.toFixed(1)} — ${phLabel(ph)}`, w / 2, h - 52)
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText(
        useCustom ? 'Custom pH' : (sub?.label ?? 'Unknown'),
        w / 2,
        h - 28,
      )
      ctx.fillStyle = '#7f8c8d'
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.fillText('0 = very acidic · 7 = neutral · 14 = very basic', w / 2, h - 10)
    },
    [running, substanceId, targetPh, useCustom],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="pH Scale"
      subtitle="Compare acidity and alkalinity of everyday substances"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPhScaleState()
        setSubstanceId('water')
        setCustomPh(7)
        setUseCustom(false)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Substance">
            <ControlHint>Pick a substance or set a custom pH with the slider.</ControlHint>
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
                }
              }}
            />
            {useCustom && (
              <ControlSlider
                label="Custom pH"
                value={customPh}
                min={0}
                max={14}
                step={0.1}
                display={customPh.toFixed(1)}
                onChange={setCustomPh}
              />
            )}
          </ControlSection>
          <ControlSection title="Reading">
            <ControlStats>
              <ControlStat label="pH" value={readoutPh.toFixed(1)} />
              <ControlStat label="Nature" value={phLabel(readoutPh)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
