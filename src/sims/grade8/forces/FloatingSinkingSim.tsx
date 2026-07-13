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

export interface FloatState {
  y: number
  velocity: number
  time: number
}

export function createFloatState(): FloatState {
  return { y: 0.5, velocity: 0, time: 0 }
}

export type FloatVerdict = 'float' | 'suspend' | 'sink'

export function floatVerdict(objectDensity: number, fluidDensity: number): FloatVerdict {
  const diff = objectDensity - fluidDensity
  if (Math.abs(diff) < 0.05) return 'suspend'
  return diff < 0 ? 'float' : 'sink'
}

/** Simple density model: object rises if ρ_obj < ρ_fluid, sinks if greater. */
export function stepFloat(
  s: FloatState,
  dt: number,
  objectDensity: number,
  fluidDensity: number,
): FloatState {
  const verdict = floatVerdict(objectDensity, fluidDensity)
  const targetY = verdict === 'float' ? 0.22 : verdict === 'sink' ? 0.88 : 0.55
  const buoyancy = (fluidDensity - objectDensity) * 0.08
  let { y, velocity } = s
  velocity += buoyancy * dt
  velocity += (targetY - y) * 2.2 * dt
  velocity *= 0.94
  y += velocity * dt
  y = Math.max(0.15, Math.min(0.92, y))
  return { ...s, y, velocity, time: s.time + dt }
}

export function FloatingSinkingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createFloatState())
  const [running, setRunning] = useState(true)
  const [objectDensity, setObjectDensity] = useState(0.8)
  const [objectVolume, setObjectVolume] = useState(50)
  const [fluidDensity, setFluidDensity] = useState(1.0)
  const [version, setVersion] = useState(0)
  const [verdict, setVerdict] = useState<FloatVerdict>('float')

  useEffect(() => {
    setVerdict(floatVerdict(objectDensity, fluidDensity))
  }, [objectDensity, fluidDensity])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running)
        stateRef.current = stepFloat(stateRef.current, dt, objectDensity, fluidDensity)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const v = floatVerdict(objectDensity, fluidDensity)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#e8f4fc')
      bg.addColorStop(0.35, '#d4ebf7')
      bg.addColorStop(1, '#a9cce3')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const tankL = w * 0.22
      const tankR = w * 0.78
      const tankT = h * 0.14
      const tankB = h * 0.86
      const waterTop = h * 0.28

      ctx.strokeStyle = '#5d6d7e'
      ctx.lineWidth = 3
      ctx.strokeRect(tankL, tankT, tankR - tankL, tankB - tankT)

      ctx.fillStyle = 'rgba(52,152,219,0.45)'
      ctx.fillRect(tankL + 3, waterTop, tankR - tankL - 6, tankB - waterTop - 3)

      const size = Math.sqrt(objectVolume / 50) * Math.min(w, h) * 0.07
      const ox = (tankL + tankR) / 2
      const oy = tankT + s.y * (tankB - tankT)

      ctx.fillStyle =
        objectDensity < fluidDensity ? '#f5b041' : objectDensity > fluidDensity ? '#7f8c8d' : '#abebc6'
      ctx.beginPath()
      ctx.arc(ox, oy, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 2
      ctx.stroke()

      if (oy - size < waterTop) {
        ctx.fillStyle = 'rgba(52,152,219,0.35)'
        ctx.beginPath()
        ctx.ellipse(ox, waterTop, size * 0.9, size * 0.25, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(`Fluid ρ = ${fluidDensity.toFixed(1)} g/cm³`, tankL, tankT - 10)
      ctx.fillText(`Object ρ = ${objectDensity.toFixed(1)} g/cm³`, tankL, tankT + fs + 2)

      const verdictText =
        v === 'float' ? 'Floats' : v === 'sink' ? 'Sinks' : 'Suspends (neutral buoyancy)'
      ctx.textAlign = 'center'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.fillStyle = v === 'float' ? '#27ae60' : v === 'sink' ? '#c0392b' : '#8e44ad'
      ctx.fillText(verdictText, w / 2, h - 36)
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = '#2c3e50'
      ctx.fillText(
        objectDensity < fluidDensity
          ? 'Less dense than fluid → buoyant force wins'
          : objectDensity > fluidDensity
            ? 'Denser than fluid → weight wins'
            : 'Densities equal → hangs in fluid',
        w / 2,
        h - 14,
      )
    },
    [fluidDensity, objectDensity, objectVolume, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Floating & Sinking"
      subtitle="Compare object density to fluid density"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createFloatState()
        setObjectDensity(0.8)
        setObjectVolume(50)
        setFluidDensity(1.0)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Object">
            <ControlHint>Water is about 1.0 g/cm³. Objects less dense float; denser objects sink.</ControlHint>
            <ControlSlider
              label="Object density"
              value={objectDensity}
              min={0.2}
              max={2.5}
              step={0.05}
              display={`${objectDensity.toFixed(2)} g/cm³`}
              onChange={setObjectDensity}
            />
            <ControlSlider
              label="Object volume (size)"
              value={objectVolume}
              min={20}
              max={100}
              step={5}
              display={`${objectVolume} cm³`}
              onChange={setObjectVolume}
            />
          </ControlSection>
          <ControlSection title="Fluid">
            <ControlSlider
              label="Fluid density"
              value={fluidDensity}
              min={0.5}
              max={13.6}
              step={0.1}
              display={`${fluidDensity.toFixed(1)} g/cm³`}
              onChange={setFluidDensity}
            />
            <ControlStats>
              <ControlStat label="Verdict" value={verdict === 'float' ? 'Floats' : verdict === 'sink' ? 'Sinks' : 'Suspends'} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
