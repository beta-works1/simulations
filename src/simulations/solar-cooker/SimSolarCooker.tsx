import { useCallback, useRef, useState } from 'react'
import { drawGlow, withShadow } from '../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../sims/shared/labels'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
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

function drawWarmSkyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, skyRatio: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * skyRatio)
  sky.addColorStop(0, '#1a5fbf')
  sky.addColorStop(0.45, '#5ba3e8')
  sky.addColorStop(1, '#ffd89b')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * skyRatio)

  const vg = ctx.createRadialGradient(
    w * 0.5,
    h * 0.35,
    Math.min(w, h) * 0.1,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.75,
  )
  vg.addColorStop(0, 'rgba(255,255,255,0.06)')
  vg.addColorStop(1, 'rgba(0,0,0,0.16)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

function drawSolarCooker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SolarCookerState,
  hover: boolean,
) {
  ctx.clearRect(0, 0, w, h)
  drawWarmSkyVignette(ctx, w, h, 0.72)

  ctx.fillStyle = '#c4a574'
  ctx.fillRect(0, h * 0.72, w, h * 0.28)

  const sunX = w * 0.78
  const sunY = h * 0.16
  const alignment = alignmentFactor(state.reflectorAngle, state.sunElevation)
  const intensity = focusIntensity(alignment)

  drawGlow(ctx, sunX, sunY, 56, '#ffeb3b', 0.25 + intensity * 0.35)
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 48)
  sunGrad.addColorStop(0, '#fff9c4')
  sunGrad.addColorStop(0.4, '#ffeb3b')
  sunGrad.addColorStop(1, 'rgba(255,235,59,0)')
  ctx.fillStyle = sunGrad
  ctx.beginPath()
  ctx.arc(sunX, sunY, 48, 0, Math.PI * 2)
  ctx.fill()
  drawLabelPill(ctx, 'Sun', sunX, sunY + 40, { fontSize: 11 })

  const potX = w * 0.42
  const potY = h * 0.62
  const reflectorPivotX = potX - 20
  const reflectorPivotY = potY + 28
  const rad = (state.reflectorAngle * Math.PI) / 180

  ctx.save()
  ctx.translate(reflectorPivotX, reflectorPivotY)
  ctx.rotate(rad)
  drawHoverHalo(ctx, 0, -40, 50, hover)
  ctx.fillStyle = hover ? '#90a4ae' : '#78909c'
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

  if (intensity > 0.05) {
    ctx.strokeStyle = `rgba(255,220,80,${0.25 + intensity * 0.55})`
    ctx.lineWidth = 1.5 + intensity * 2
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(sunX - i * 6, sunY + 20)
      ctx.quadraticCurveTo(w * 0.6 + i * 8, h * 0.35, potX + i * 4, potY - 18)
      ctx.stroke()
    }
  }

  withShadow(ctx, () => {
    ctx.fillStyle = '#37474f'
    ctx.beginPath()
    ctx.ellipse(potX, potY + 8, 38, 10, 0, 0, Math.PI * 2)
    ctx.fill()
  }, { blur: 12, oy: 4 })
  drawLabelPill(ctx, 'pot', potX, potY + 28, { fontSize: 11 })

  const potHeat = Math.min(1, (state.temperature - 20) / 80)
  withShadow(ctx, () => {
    ctx.fillStyle = `rgb(${120 + potHeat * 135}, ${60 + potHeat * 40}, ${50})`
    ctx.beginPath()
    ctx.moveTo(potX - 34, potY)
    ctx.lineTo(potX - 28, potY - 32)
    ctx.lineTo(potX + 28, potY - 32)
    ctx.lineTo(potX + 34, potY)
    ctx.closePath()
    ctx.fill()
  }, { blur: 10, oy: 3 })

  if (potHeat > 0.25) {
    drawGlow(ctx, potX, potY - 16, 28 + potHeat * 18, '#ff7043', 0.15 + potHeat * 0.25)
  }

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

  drawValueChip(ctx, '', `${state.temperature.toFixed(0)}°C · ${tempLabel(state.temperature)}`, 22, 28, {
    align: 'left',
    accent: true,
    fontSize: 12,
  })
  drawValueChip(ctx, 'Focus', `${(intensity * 100).toFixed(0)}%`, 22, 52, {
    align: 'left',
    fontSize: 11,
  })
  drawValueChip(ctx, '∠', `${state.reflectorAngle.toFixed(0)}°`, reflectorPivotX, reflectorPivotY - 70, {
    fontSize: 12,
  })
  drawHint(ctx, 'drag reflector to aim', w / 2, h - 16, w, h)
}

export function SolarCookerSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<SolarCookerState>(createInitialState())
  const hoverRef = useRef(false)
  const [running, setRunning] = useState(true)
  const [angle, setAngle] = useState(createInitialState().reflectorAngle)
  const [temp, setTemp] = useState(20)
  const [alignPct, setAlignPct] = useState(0)

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepSolarCooker({ ...s, running: true }, dt),
    draw: (ctx, ww, hh, s) => drawSolarCooker(ctx, ww, hh, s, hoverRef.current),
    onSync: (s) => {
      setAngle(s.reflectorAngle)
      setTemp(s.temperature)
      setAlignPct(alignmentFactor(s.reflectorAngle, s.sunElevation) * 100)
    },
  })

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const potX = size.w * 0.42
      const potY = size.h * 0.62
      const px = potX - 20
      const py = potY + 28
      return Math.hypot(pt.x - px, pt.y - (py - 40)) < 70 ? 'reflector' : null
    },
    onHoverChange: (id) => {
      hoverRef.current = id === 'reflector'
    },
    onDrag: (_id, pt, size) => {
      const potX = size.w * 0.42
      const potY = size.h * 0.62
      const px = potX - 20
      const py = potY + 28
      const ang = (Math.atan2(pt.y - py, pt.x - px) * 180) / Math.PI
      stateRef.current = {
        ...stateRef.current,
        reflectorAngle: clamp(ang, MIN_ANGLE, MAX_ANGLE),
      }
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Solar Cooker"
      subtitle="Focus sunlight onto the pot with a parabolic reflector."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Solar Cooker</h3>
          <p className="sim-hint">
            Drag the reflector on the canvas (or use the slider) to focus sunlight onto the pot.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Reflector angle</span>
              <span>{angle.toFixed(0)}°</span>
            </label>
            <input
              type="range"
              min={MIN_ANGLE}
              max={MAX_ANGLE}
              step={1}
              value={angle}
              onChange={(e) => {
                const v = Number(e.target.value)
                setAngle(v)
                stateRef.current = { ...stateRef.current, reflectorAngle: v }
              }}
            />
          </div>
          <p className="sim-readout">
            Alignment: {alignPct.toFixed(0)}%
            <br />
            Temperature: {temp.toFixed(1)}°C
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
