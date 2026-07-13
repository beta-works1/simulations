import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export interface FermentState {
  sugar: number
  alcohol: number
  co2: number
  yeast: number
  temp: number
  time: number
}

export function createFermentState(): FermentState {
  return { sugar: 100, alcohol: 0, co2: 0, yeast: 20, temp: 0.6, time: 0 }
}

export function stepFerment(s: FermentState, dt: number): FermentState {
  const rate = s.temp * s.yeast * 0.04 * dt
  const used = Math.min(s.sugar, rate * 8)
  return {
    ...s,
    sugar: Math.max(0, s.sugar - used),
    alcohol: Math.min(100, s.alcohol + used * 0.45),
    co2: Math.min(100, s.co2 + used * 0.55),
    yeast: Math.min(80, s.yeast + used * 0.05 * s.temp),
    time: s.time + dt,
  }
}

export function FermentationSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createFermentState())
  const [running, setRunning] = useState(true)
  const [temp, setTemp] = useState(0.6)
  const [version, setVersion] = useState(0)
  const bubbles = useRef<{ x: number; y: number; r: number; v: number }[]>([])

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    stateRef.current.temp = temp
    if (dt > 0 && running) stateRef.current = stepFerment(stateRef.current, dt)
    const s = stateRef.current

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#2c1a12'
    ctx.fillRect(0, 0, w, h)

    // flask
    const fx = w * 0.35
    const top = h * 0.15
    const bottom = h * 0.85
    const neckW = 36
    const bodyW = 110

    ctx.strokeStyle = '#d5dbdb'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(fx - neckW, top)
    ctx.lineTo(fx - neckW, h * 0.35)
    ctx.lineTo(fx - bodyW, bottom)
    ctx.lineTo(fx + bodyW, bottom)
    ctx.lineTo(fx + neckW, h * 0.35)
    ctx.lineTo(fx + neckW, top)
    ctx.stroke()

    const fillH = (bottom - h * 0.4) * (0.35 + s.sugar / 200)
    const level = bottom - fillH
    ctx.fillStyle = `rgba(241, 196, 15, ${0.35 + s.sugar / 300})`
    ctx.beginPath()
    ctx.moveTo(fx - bodyW + 8, bottom - 2)
    ctx.lineTo(fx + bodyW - 8, bottom - 2)
    ctx.lineTo(fx + neckW - 4, level)
    ctx.lineTo(fx - neckW + 4, level)
    ctx.closePath()
    ctx.fill()

    // yeast dots
    for (let i = 0; i < Math.round(s.yeast / 3); i++) {
      ctx.fillStyle = '#ad1457'
      ctx.beginPath()
      ctx.arc(fx - 50 + (i * 37) % 100, level + 20 + (i * 19) % Math.max(10, fillH - 30), 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // CO2 bubbles
    if (running && s.sugar > 0.5) {
      if (Math.random() < s.temp * 0.4) {
        bubbles.current.push({
          x: fx - 40 + Math.random() * 80,
          y: level,
          r: 2 + Math.random() * 4,
          v: 20 + Math.random() * 40,
        })
      }
    }
    bubbles.current = bubbles.current
      .map((b) => ({ ...b, y: b.y - b.v * dt }))
      .filter((b) => b.y > top)
    for (const b of bubbles.current) {
      ctx.strokeStyle = 'rgba(236,240,241,0.8)'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // meters
    const drawBar = (x: number, label: string, value: number, color: string) => {
      ctx.fillStyle = '#566573'
      ctx.fillRect(x, h * 0.25, 18, h * 0.5)
      ctx.fillStyle = color
      ctx.fillRect(x, h * 0.25 + h * 0.5 * (1 - value / 100), 18, h * 0.5 * (value / 100))
      ctx.fillStyle = '#ecf0f1'
      ctx.font = '11px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(label, x + 9, h * 0.25 - 8)
      ctx.fillText(value.toFixed(0), x + 9, h * 0.78)
    }
    drawBar(w * 0.7, 'Sugar', s.sugar, '#f1c40f')
    drawBar(w * 0.78, 'CO₂', s.co2, '#85c1e9')
    drawBar(w * 0.86, 'Alcohol', s.alcohol, '#e67e22')

    ctx.fillStyle = '#ecf0f1'
    ctx.font = '13px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Yeast + sugar → CO₂ + alcohol', 16, 24)
  }, [running, temp])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Fermentation Process"
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
          <p className="hint">Warm conditions speed yeast converting sugar into CO₂ and alcohol.</p>
          <label>
            Temperature
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
            />
          </label>
          <div className="stat">
            <span>Sugar left</span>
            <strong>{stateRef.current.sugar.toFixed(0)}</strong>
          </div>
          <div className="stat">
            <span>CO₂</span>
            <strong>{stateRef.current.co2.toFixed(0)}</strong>
          </div>
        </>
      }
    />
  )
}
