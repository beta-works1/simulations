import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
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

function drawWindTurbine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: WindTurbineState,
) {
  ctx.clearRect(0, 0, w, h)

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65)
  sky.addColorStop(0, '#0c4a6e')
  sky.addColorStop(1, '#7dd3fc')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * 0.65)

  ctx.fillStyle = '#4ade80'
  ctx.fillRect(0, h * 0.65, w, h * 0.35)

  const rpm = bladeRpm(state.windSpeed)
  const wind = state.windSpeed

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

  ctx.fillStyle = '#64748b'
  ctx.beginPath()
  ctx.moveTo(towerX - 14, towerBase)
  ctx.lineTo(towerX + 14, towerBase)
  ctx.lineTo(towerX + 6, hubY + 20)
  ctx.lineTo(towerX - 6, hubY + 20)
  ctx.closePath()
  ctx.fill()

  ctx.save()
  ctx.translate(towerX, hubY)
  ctx.rotate((state.bladeAngle * Math.PI) / 180)

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
  const [state, setState] = useState<WindTurbineState>(createInitialState)

  useAnimationLoop(state.running, (dt) => {
    setState((s) => stepWindTurbine(s, dt))
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawWindTurbine(ctx, w, h, state)
  }, [w, h, state])

  const reset = useCallback(() => setState(createInitialState()), [])
  const rpm = bladeRpm(state.windSpeed)
  const power = powerOutputKw(state.windSpeed)

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Wind Turbine</h3>
          <p className="sim-hint">
            Wind spins the blades, converting kinetic energy to mechanical rotation, then to
            electrical power in the generator.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Wind speed</span>
              <span>{state.windSpeed.toFixed(1)} m/s</span>
            </label>
            <input
              type="range"
              min={MIN_WIND}
              max={MAX_WIND}
              step={0.5}
              value={state.windSpeed}
              onChange={(e) => setState((s) => ({ ...s, windSpeed: Number(e.target.value) }))}
            />
          </div>
          <p className="sim-readout">
            RPM: {rpm.toFixed(1)}
            <br />
            Power: {formatPower(power)}
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={state.running}
          onToggle={() => setState((s) => ({ ...s, running: !s.running }))}
          onReset={reset}
        />
      }
    />
  )
}
