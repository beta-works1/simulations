import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
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
  const [temp, setTemp] = useState(15)

  useEffect(() => {
    const id = window.setInterval(() => setTemp(stateRef.current.temperature), 160)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      stateRef.current.co2Level = co2
      if (dt > 0 && running) stateRef.current = stepGreenhouse(stateRef.current, dt)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const heat = Math.min(1, (s.temperature - 10) / 30)

      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, `rgb(${40 + heat * 90}, ${90 - heat * 45}, ${150 - heat * 70})`)
      sky.addColorStop(1, `rgb(${170 + heat * 70}, ${130 - heat * 35}, ${55})`)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const sunX = w * 0.16
      const sunY = h * 0.2
      ctx.save()
      ctx.shadowColor = '#f1c40f'
      ctx.shadowBlur = 24
      ctx.fillStyle = '#f4d03f'
      ctx.beginPath()
      ctx.arc(sunX, sunY, Math.min(w, h) * 0.055, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      for (let i = 0; i < 7; i++) {
        const y = h * 0.12 + i * ((h * 0.7) / 7)
        ctx.strokeStyle = 'rgba(241,196,15,0.5)'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(sunX + 28, sunY)
        ctx.lineTo(w * 0.52, y)
        ctx.stroke()
      }

      const thick = 16 + co2 * Math.min(w * 0.12, 70)
      ctx.fillStyle = `rgba(176, 190, 197, ${0.22 + co2 * 0.45})`
      ctx.fillRect(w * 0.5, h * 0.08, thick, h * 0.78)

      const bounce = Math.floor(2 + co2 * 7)
      for (let i = 0; i < bounce; i++) {
        const t = (s.time * 0.45 + i * 0.28) % 1
        const x = w * 0.52 + Math.sin(t * Math.PI) * (thick + 18)
        const y = h * 0.15 + ((i * 41 + s.time * 50) % (h * 0.65))
        ctx.strokeStyle = `rgba(231, 76, 60, ${0.45 + 0.4 * Math.sin(s.time + i)})`
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(w * 0.78, y)
        ctx.lineTo(x, y - 8)
        ctx.stroke()
      }

      ctx.fillStyle = '#fff'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(`Surface: ${s.temperature.toFixed(1)} °C`, 14, h - 28)
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText('Yellow rays = sunlight · Red = trapped IR · Band = greenhouse gases', 14, h - 10)

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
    },
    [co2, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Global Warming Mechanism"
      subtitle="Greenhouse gases trap infrared heat near Earth"
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
          <ControlSection title="Atmosphere">
            <ControlHint>Increase gases and watch more heat bounce back to the surface.</ControlHint>
            <ControlSlider
              label="Greenhouse gases"
              value={co2}
              min={0.05}
              max={1}
              step={0.05}
              display={`${Math.round(co2 * 100)}%`}
              onChange={setCo2}
            />
          </ControlSection>
          <ControlSection title="Result">
            <ControlStats>
              <ControlStat label="Temperature" value={`${temp.toFixed(1)} °C`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
