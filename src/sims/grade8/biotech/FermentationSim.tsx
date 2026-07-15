import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
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
import { createFermentState, stepFerment } from './fermentationModel'

type Layout = {
  thermo: { x: number; y: number; w: number; h: number }
  dial: { cx: number; cy: number; r: number }
}

export function FermentationSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createFermentState())
  const paramsRef = useRef({ temp: 0.6 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [temp, setTemp] = useState(0.6)
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ sugar: 100, co2: 0, alcohol: 0 })
  const bubbles = useRef<{ x: number; y: number; r: number; v: number }[]>([])

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      setReadout({ sugar: s.sugar, co2: s.co2, alcohol: s.alcohol })
      setTemp(Math.round(paramsRef.current.temp * 100) / 100)
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      const t = L.thermo
      if (pt.x >= t.x - 8 && pt.x <= t.x + t.w + 8 && pt.y >= t.y - 8 && pt.y <= t.y + t.h + 8)
        return 'thermo'
      if (Math.hypot(pt.x - L.dial.cx, pt.y - L.dial.cy) < L.dial.r + 10) return 'dial'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      const L = layoutRef.current
      if (!L) return
      hintShown.current = false
      if (id === 'thermo') {
        const t = clamp(1 - (pt.y - L.thermo.y) / L.thermo.h, 0.1, 1)
        paramsRef.current.temp = t
        return
      }
      if (id === 'dial') {
        const ang = Math.atan2(pt.y - L.dial.cy, pt.x - L.dial.cx)
        const frac = clamp((ang + Math.PI / 2) / Math.PI, 0, 1)
        paramsRef.current.temp = 0.1 + frac * 0.9
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const tempVal = paramsRef.current.temp
      stateRef.current.temp = tempVal
      if (dt > 0 && running) stateRef.current = stepFerment(stateRef.current, dt)
      const s = stateRef.current
      const fs = fontPx(12, w, h)
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'biotech')

      const fx = w * 0.3
      const top = h * 0.14
      const bottom = h * 0.86
      const neckW = Math.min(40, w * 0.05)
      const bodyW = Math.min(120, w * 0.18)
      const fillH = (bottom - h * 0.4) * (0.35 + s.sugar / 200)
      const level = bottom - fillH

      withShadow(ctx, () => {
        ctx.strokeStyle = '#d5dbdb'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(fx - neckW, top)
        ctx.lineTo(fx - neckW, h * 0.34)
        ctx.lineTo(fx - bodyW, bottom)
        ctx.lineTo(fx + bodyW, bottom)
        ctx.lineTo(fx + neckW, h * 0.34)
        ctx.lineTo(fx + neckW, top)
        ctx.stroke()

        ctx.fillStyle = `rgba(241, 196, 15, ${0.35 + s.sugar / 280})`
        ctx.beginPath()
        ctx.moveTo(fx - bodyW + 8, bottom - 2)
        ctx.lineTo(fx + bodyW - 8, bottom - 2)
        ctx.lineTo(fx + neckW - 4, level)
        ctx.lineTo(fx - neckW + 4, level)
        ctx.closePath()
        ctx.fill()
      })

      for (let i = 0; i < Math.round(s.yeast / 3); i++) {
        ctx.fillStyle = '#ad1457'
        ctx.beginPath()
        ctx.arc(
          fx - 48 + ((i * 37) % 96),
          level + 18 + ((i * 19) % Math.max(12, fillH - 28)),
          3,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      if (running && s.sugar > 0.5 && Math.random() < tempVal * 0.45) {
        bubbles.current.push({
          x: fx - 40 + Math.random() * 80,
          y: level,
          r: 2 + Math.random() * 4,
          v: 22 + Math.random() * 40,
        })
      }
      bubbles.current = bubbles.current
        .map((b) => ({ ...b, y: b.y - b.v * dt }))
        .filter((b) => b.y > top)
      for (const b of bubbles.current) {
        ctx.strokeStyle = 'rgba(236,240,241,0.85)'
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      const drawBar = (x: number, label: string, value: number, color: string) => {
        const bh = h * 0.5
        const by = h * 0.24
        ctx.fillStyle = '#566573'
        ctx.fillRect(x, by, 18, bh)
        ctx.fillStyle = color
        ctx.fillRect(x, by + bh * (1 - value / 100), 18, bh * (value / 100))
        ctx.fillStyle = '#ecf0f1'
        ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(label, x + 9, by - 10)
        ctx.fillText(value.toFixed(0), x + 9, by + bh + 16)
      }

      drawBar(w * 0.68, 'Sugar', s.sugar, '#f1c40f')
      drawBar(w * 0.78, 'CO₂', s.co2, '#85c1e9')
      drawBar(w * 0.88, 'Alcohol', s.alcohol, '#e67e22')

      // Thermometer (drag vertical)
      const thX = w * 0.52
      const thTop = h * 0.22
      const thH = h * 0.48
      const thW = 14
      const bulbR = 16
      const fillFrac = (tempVal - 0.1) / 0.9
      const mercuryH = thH * fillFrac
      const mercuryY = thTop + thH - mercuryH

      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fillRect(thX - thW / 2, thTop, thW, thH)
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(thX - thW / 2 + 2, mercuryY, thW - 4, mercuryH)
      ctx.beginPath()
      ctx.arc(thX, thTop + thH + bulbR * 0.35, bulbR, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(thX - thW / 2, thTop, thW, thH)

      const knobY = mercuryY
      drawHoverHalo(ctx, thX, knobY, 14, hover === 'thermo')
      ctx.beginPath()
      ctx.arc(thX, knobY, 7, 0, Math.PI * 2)
      ctx.fillStyle = hover === 'thermo' ? '#f5b7b1' : '#ecf0f1'
      ctx.fill()

      drawLabelPill(ctx, 'Temp', thX, thTop - 16, { fontSize: Math.max(10, fs - 2) })
      drawValueChip(
        ctx,
        '',
        tempVal < 0.35 ? 'Cool' : tempVal < 0.7 ? 'Warm' : 'Hot',
        thX,
        thTop + thH + bulbR + 22,
        { fontSize: Math.max(10, fs - 2), accent: true },
      )

      // Small dial (drag angle)
      const dialCx = w * 0.52
      const dialCy = h * 0.14
      const dialR = Math.min(28, Math.min(w, h) * 0.045)
      ctx.beginPath()
      ctx.arc(dialCx, dialCy, dialR, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fill()
      ctx.strokeStyle = hover === 'dial' ? '#5dade2' : 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()
      const needleAng = -Math.PI / 2 + fillFrac * Math.PI
      ctx.strokeStyle = '#e74c3c'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(dialCx, dialCy)
      ctx.lineTo(dialCx + Math.cos(needleAng) * (dialR - 4), dialCy + Math.sin(needleAng) * (dialR - 4))
      ctx.stroke()
      drawHoverHalo(ctx, dialCx, dialCy, dialR + 4, hover === 'dial')
      drawLabelPill(ctx, 'dial', dialCx + dialR + 28, dialCy, {
        fontSize: Math.max(9, fs - 3),
        bold: false,
        align: 'left',
      })

      layoutRef.current = {
        thermo: { x: thX - thW / 2, y: thTop, w: thW, h: thH + bulbR },
        dial: { cx: dialCx, cy: dialCy, r: dialR },
      }

      ctx.fillStyle = '#ecf0f1'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('Yeast + sugar → CO₂ + alcohol', 14, 24)

      if (hintShown.current) {
        drawHint(ctx, 'drag thermometer or dial to set temperature', w / 2, h - 16, w, h, {
          muted: true,
        })
      }
    },
    [running, temp],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Fermentation Process"
      subtitle="Yeast converts sugar into CO₂ and alcohol"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createFermentState()
        bubbles.current = []
        paramsRef.current.temp = 0.6
        setTemp(0.6)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Conditions">
            <ControlHint>Warmer conditions usually speed fermentation (until enzymes denature).</ControlHint>
            <ControlSlider
              label="Temperature"
              value={temp}
              min={0.1}
              max={1}
              step={0.05}
              display={temp < 0.35 ? 'Cool' : temp < 0.7 ? 'Warm' : 'Hot'}
              onChange={(v) => {
                hintShown.current = false
                paramsRef.current.temp = v
                setTemp(v)
              }}
            />
          </ControlSection>
          <ControlSection title="Products">
            <ControlStats>
              <ControlStat label="Sugar left" value={readout.sugar.toFixed(0)} />
              <ControlStat label="CO₂" value={readout.co2.toFixed(0)} />
              <ControlStat label="Alcohol" value={readout.alcohol.toFixed(0)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
