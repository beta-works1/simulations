import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  alignmentFactor,
  createInitialState,
  focusIntensity,
  MAX_ANGLE,
  MIN_ANGLE,
  stepSolarCooker,
  tempLabel,
  type SolarCookerState,
} from './model'

function drawSolarCooker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SolarCookerState,
) {
  ctx.clearRect(0, 0, w, h)

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72)
  sky.addColorStop(0, '#1e6fd9')
  sky.addColorStop(1, '#87ceeb')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * 0.72)

  ctx.fillStyle = '#c4a574'
  ctx.fillRect(0, h * 0.72, w, h * 0.28)

  const sunX = w * 0.78
  const sunY = h * 0.16
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 48)
  sunGrad.addColorStop(0, '#fff9c4')
  sunGrad.addColorStop(0.4, '#ffeb3b')
  sunGrad.addColorStop(1, 'rgba(255,235,59,0)')
  ctx.fillStyle = sunGrad
  ctx.beginPath()
  ctx.arc(sunX, sunY, 48, 0, Math.PI * 2)
  ctx.fill()

  const potX = w * 0.42
  const potY = h * 0.62
  const reflectorPivotX = potX - 20
  const reflectorPivotY = potY + 28
  const rad = (state.reflectorAngle * Math.PI) / 180

  ctx.save()
  ctx.translate(reflectorPivotX, reflectorPivotY)
  ctx.rotate(rad)

  ctx.fillStyle = '#78909c'
  ctx.beginPath()
  ctx.moveTo(-110, 0)
  ctx.quadraticCurveTo(0, -95, 110, 0)
  ctx.lineTo(110, 12)
  ctx.quadraticCurveTo(0, -83, -110, 12)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,220,100,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-100, 4)
  ctx.quadraticCurveTo(0, -88, 100, 4)
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = '#455a64'
  ctx.fillRect(reflectorPivotX - 8, reflectorPivotY, 16, 36)

  const alignment = alignmentFactor(state.reflectorAngle, state.sunElevation)
  const intensity = focusIntensity(alignment)

  if (intensity > 0.05) {
    ctx.strokeStyle = `rgba(255,220,80,${0.25 + intensity * 0.55})`
    ctx.lineWidth = 1.5 + intensity * 2
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(sunX - i * 6, sunY + 20)
      const hitX = potX + i * 4
      const hitY = potY - 18
      ctx.quadraticCurveTo(w * 0.6 + i * 8, h * 0.35, hitX, hitY)
      ctx.stroke()
    }
  }

  ctx.fillStyle = '#37474f'
  ctx.beginPath()
  ctx.ellipse(potX, potY + 8, 38, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  const potHeat = Math.min(1, (state.temperature - 20) / 80)
  ctx.fillStyle = `rgb(${120 + potHeat * 135}, ${60 + potHeat * 40}, ${50})`
  ctx.beginPath()
  ctx.moveTo(potX - 34, potY)
  ctx.lineTo(potX - 28, potY - 32)
  ctx.lineTo(potX + 28, potY - 32)
  ctx.lineTo(potX + 34, potY)
  ctx.closePath()
  ctx.fill()

  if (potHeat > 0.4) {
    ctx.strokeStyle = `rgba(255,255,255,${(potHeat - 0.4) * 0.8})`
    ctx.lineWidth = 2
    for (let s = 0; s < 3; s++) {
      ctx.beginPath()
      ctx.moveTo(potX - 10 + s * 10, potY - 34)
      ctx.quadraticCurveTo(potX - 8 + s * 10, potY - 50 - s * 4, potX - 6 + s * 10, potY - 58 - s * 6)
      ctx.stroke()
    }
  }

  ctx.fillStyle = 'rgba(15,23,42,0.75)'
  ctx.fillRect(12, 12, 168, 52)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 13px Roboto, sans-serif'
  ctx.fillText(`${state.temperature.toFixed(0)}°C — ${tempLabel(state.temperature)}`, 22, 34)
  ctx.font = '12px Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(`Focus: ${(intensity * 100).toFixed(0)}%`, 22, 52)
}

export function SolarCookerSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<SolarCookerState>(createInitialState)

  useAnimationLoop(state.running, (dt) => {
    setState((s) => stepSolarCooker(s, dt))
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawSolarCooker(ctx, w, h, state)
  }, [w, h, state])

  const reset = useCallback(() => setState(createInitialState()), [])

  const alignment = alignmentFactor(state.reflectorAngle, state.sunElevation)

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Solar Cooker</h3>
          <p className="sim-hint">
            Adjust the parabolic reflector to focus sunlight onto the pot. Best alignment heats the
            pot fastest.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Reflector angle</span>
              <span>{state.reflectorAngle.toFixed(0)}°</span>
            </label>
            <input
              type="range"
              min={MIN_ANGLE}
              max={MAX_ANGLE}
              step={1}
              value={state.reflectorAngle}
              onChange={(e) =>
                setState((s) => ({ ...s, reflectorAngle: Number(e.target.value) }))
              }
            />
          </div>
          <p className="sim-readout">
            Alignment: {(alignment * 100).toFixed(0)}%
            <br />
            Temperature: {state.temperature.toFixed(1)}°C
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
