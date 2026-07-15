import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, withShadow } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { createFermentState, stepFerment } from './fermentationModel'

export function FermentationSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createFermentState())
  const [running, setRunning] = useState(true)
  const [temp, setTemp] = useState(0.6)
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ sugar: 100, co2: 0, alcohol: 0 })
  const bubbles = useRef<{ x: number; y: number; r: number; v: number }[]>([])

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      setReadout({ sugar: s.sugar, co2: s.co2, alcohol: s.alcohol })
    }, 180)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      stateRef.current.temp = temp
      if (dt > 0 && running) stateRef.current = stepFerment(stateRef.current, dt)
      const s = stateRef.current
      const fs = fontPx(12, w, h)

      clearThemedScene(ctx, w, h, 'biotech')

      const fx = w * 0.34
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
          fx - 48 + (i * 37) % 96,
          level + 18 + (i * 19) % Math.max(12, fillH - 28),
          3,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      if (running && s.sugar > 0.5 && Math.random() < temp * 0.45) {
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

      ctx.fillStyle = '#ecf0f1'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('Yeast + sugar → CO₂ + alcohol', 14, 24)
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
        setTemp(0.6)
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
              onChange={setTemp}
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
