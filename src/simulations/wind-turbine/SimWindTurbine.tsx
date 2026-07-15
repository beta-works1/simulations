import { useCallback, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, withShadow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  bladeRpm,
  createInitialState,
  formatPower,
  MAX_WIND,
  mechanicalPowerKw,
  MIN_WIND,
  powerOutputKw,
  stepWindTurbine,
  type WindTurbineState,
} from './model'

function drawWarmSkyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, skyRatio: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * skyRatio)
  sky.addColorStop(0, '#0c4a6e')
  sky.addColorStop(0.5, '#7dd3fc')
  sky.addColorStop(1, '#fde68a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * skyRatio)

  const vg = ctx.createRadialGradient(
    w * 0.5,
    h * 0.3,
    Math.min(w, h) * 0.1,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.75,
  )
  vg.addColorStop(0, 'rgba(255,255,255,0.05)')
  vg.addColorStop(1, 'rgba(0,0,0,0.14)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

function drawWindTurbine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: WindTurbineState,
) {
  ctx.clearRect(0, 0, w, h)
  drawWarmSkyVignette(ctx, w, h, 0.65)

  ctx.fillStyle = '#4ade80'
  ctx.fillRect(0, h * 0.65, w, h * 0.35)

  const rpm = bladeRpm(state.windSpeed)
  const wind = state.windSpeed
  const hubActive = rpm > 0.5

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  for (let i = 0; i < 5; i++) {
    const y = h * 0.28 + i * 14
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(20 + wind * 8 + i * 6, y)
    ctx.stroke()
  }

  const towerX = w * 0.38
  const towerBase = h * 0.65
  const hubY = h * 0.28

  withShadow(ctx, () => {
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.moveTo(towerX - 14, towerBase)
    ctx.lineTo(towerX + 14, towerBase)
    ctx.lineTo(towerX + 6, hubY + 20)
    ctx.lineTo(towerX - 6, hubY + 20)
    ctx.closePath()
    ctx.fill()
  }, { blur: 14, oy: 5 })

  ctx.save()
  ctx.translate(towerX, hubY)
  ctx.rotate((state.bladeAngle * Math.PI) / 180)

  if (hubActive) {
    drawGlow(ctx, 0, 0, 42 + Math.min(rpm, 30) * 0.8, '#7dd3fc', 0.18 + Math.min(rpm, 30) * 0.01)
  }

  withShadow(ctx, () => {
    ctx.fillStyle = '#e2e8f0'
    for (let b = 0; b < 3; b++) {
      ctx.save()
      ctx.rotate((b * Math.PI * 2) / 3)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(18, -55, 8, -110)
      ctx.quadraticCurveTo(0, -115, -8, -110)
      ctx.quadraticCurveTo(-18, -55, 0, 0)
      ctx.fill()
      ctx.restore()
    }
  }, { blur: 10, oy: 3 })

  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const boxX = w * 0.58
  const boxY = h * 0.18
  const boxW = w * 0.34
  const boxH = h * 0.42

  ctx.fillStyle = 'rgba(15,23,42,0.82)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = 'rgba(56,189,248,0.4)'
  ctx.strokeRect(boxX, boxY, boxW, boxH)

  const stages = [
    { label: 'Wind', value: `${wind.toFixed(1)} m/s`, color: '#38bdf8' },
    { label: 'Mechanical', value: formatPower(mechanicalPowerKw(wind)), color: '#a78bfa' },
    { label: 'Electrical', value: formatPower(powerOutputKw(wind)), color: '#fbbf24' },
  ]

  ctx.font = '600 11px Roboto, sans-serif'
  stages.forEach((stage, i) => {
    const y = boxY + 36 + i * 52
    ctx.fillStyle = stage.color
    ctx.fillRect(boxX + 14, y - 10, 8, 8)
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(stage.label, boxX + 28, y - 2)
    ctx.fillStyle = '#f1f5f9'
    ctx.font = '600 14px Roboto, sans-serif'
    ctx.fillText(stage.value, boxX + 28, y + 16)
    ctx.font = '600 11px Roboto, sans-serif'
    if (i < stages.length - 1) {
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.beginPath()
      ctx.moveTo(boxX + 18, y + 24)
      ctx.lineTo(boxX + 18, y + 36)
      ctx.stroke()
    }
  })

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 13px Roboto, sans-serif'
  ctx.fillText(`Blade RPM: ${rpm.toFixed(1)}`, 16, h - 18)
}

export function WindTurbineSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<WindTurbineState>(createInitialState())
  const [running, setRunning] = useState(true)
  const [windSpeed, setWindSpeed] = useState(createInitialState().windSpeed)
  const [rpm, setRpm] = useState(0)
  const [powerLabel, setPowerLabel] = useState('0 kW')

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepWindTurbine({ ...s, running: true }, dt),
    draw: drawWindTurbine,
    onSync: (s) => {
      setWindSpeed(s.windSpeed)
      setRpm(bladeRpm(s.windSpeed))
      setPowerLabel(formatPower(powerOutputKw(s.windSpeed)))
    },
  })

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      // Left/center scene (not the readout box)
      if (pt.x < size.w * 0.55) return 'wind'
      return null
    },
    onDrag: (_id, pt, size) => {
      const t = clamp(pt.x / Math.max(1, size.w * 0.55), 0, 1)
      const v = Math.round((MIN_WIND + t * (MAX_WIND - MIN_WIND)) * 2) / 2
      stateRef.current = { ...stateRef.current, windSpeed: v }
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setWindSpeed(createInitialState().windSpeed)
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Wind Turbine"
      subtitle="Wind spins blades and converts energy to electrical power."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Wind Turbine</h3>
          <p className="sim-hint">
            Wind spins the blades, converting kinetic energy to mechanical rotation, then to
            electrical power in the generator. Drag across the sky/turbine to set wind speed.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Wind speed</span>
              <span>{windSpeed.toFixed(1)} m/s</span>
            </label>
            <input
              type="range"
              min={MIN_WIND}
              max={MAX_WIND}
              step={0.5}
              value={windSpeed}
              onChange={(e) => {
                const v = Number(e.target.value)
                setWindSpeed(v)
                stateRef.current = { ...stateRef.current, windSpeed: v }
              }}
            />
          </div>
          <p className="sim-readout">
            RPM: {rpm.toFixed(1)}
            <br />
            Power: {powerLabel}
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={reset}
        />
      }
    />
  )
}
