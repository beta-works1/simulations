import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export interface GreenhouseState {
  co2Level: number
  temperature: number
  time: number
}

export function createGreenhouseState(): GreenhouseState {
  return { co2Level: 0.4, temperature: 15, time: 0 }
}

export function stepGreenhouse(s: GreenhouseState, dt: number): GreenhouseState {
  const target = 10 + s.co2Level * 28
  const temperature = s.temperature + (target - s.temperature) * Math.min(1, dt * 0.35)
  return { ...s, temperature, time: s.time + dt }
}

export function GlobalWarmingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createGreenhouseState())
  const [running, setRunning] = useState(true)
  const [co2, setCo2] = useState(0.4)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    stateRef.current.co2Level = co2
    if (dt > 0 && running) stateRef.current = stepGreenhouse(stateRef.current, dt)
    const s = stateRef.current

    ctx.clearRect(0, 0, w, h)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    const heat = Math.min(1, (s.temperature - 10) / 30)
    sky.addColorStop(0, `rgb(${40 + heat * 80}, ${80 - heat * 40}, ${140 - heat * 60})`)
    sky.addColorStop(1, `rgb(${180 + heat * 60}, ${140 - heat * 40}, ${60})`)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    // sun rays
    const sunX = w * 0.18
    const sunY = h * 0.22
    ctx.fillStyle = '#f1c40f'
    ctx.beginPath()
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2)
    ctx.fill()

    for (let i = 0; i < 7; i++) {
      const y = 40 + i * ((h - 80) / 7)
      ctx.strokeStyle = 'rgba(241,196,15,0.55)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(sunX + 30, sunY)
      ctx.lineTo(w * 0.55, y)
      ctx.stroke()
    }

    // atmosphere blanket thickness from CO2
    const thick = 18 + co2 * 50
    ctx.fillStyle = `rgba(149, 165, 166, ${0.25 + co2 * 0.4})`
    ctx.fillRect(w * 0.48, 20, thick, h - 40)

    // trapped IR bouncing
    const bounce = Math.floor(2 + co2 * 6)
    for (let i = 0; i < bounce; i++) {
      const t = (s.time * 0.4 + i * 0.3) % 1
      const x = w * 0.55 + Math.sin(t * Math.PI) * (thick + 20)
      const y = 50 + ((i * 37 + s.time * 40) % (h - 100))
      ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + 0.4 * Math.sin(s.time + i)})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(w * 0.75, y)
      ctx.lineTo(x, y - 10)
      ctx.stroke()
    }

    ctx.fillStyle = '#fff'
    ctx.font = '600 16px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Surface temp: ${s.temperature.toFixed(1)} °C`, 16, h - 24)
    ctx.font = '12px Roboto, sans-serif'
    ctx.fillText('Yellow = sunlight · Red = trapped infrared · Gray band = greenhouse gases', 16, h - 8)
  }, [co2, running])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Global Warming Mechanism"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createGreenhouseState()
        setCo2(0.4)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Raise greenhouse gases and watch more heat get trapped near Earth.</p>
          <label>
            Greenhouse gas level
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={co2}
              onChange={(e) => setCo2(Number(e.target.value))}
            />
          </label>
          <div className="stat">
            <span>Temperature</span>
            <strong>{stateRef.current.temperature.toFixed(1)} °C</strong>
          </div>
        </>
      }
    />
  )
}
