import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export interface PressureState {
  pressDepth: number
  time: number
}

export function createPressureState(): PressureState {
  return { pressDepth: 0, time: 0 }
}

export function stepPressure(s: PressureState, dt: number, running: boolean): PressureState {
  let { pressDepth } = s
  if (running) pressDepth = Math.min(1, pressDepth + dt * 0.6)
  return { ...s, pressDepth, time: s.time + dt }
}

/** Pressure P = F / A (force in N, area in cm² → kPa scale for display). */
export function calcPressure(force: number, area: number): number {
  return force / Math.max(0.5, area)
}

export function PressureForceAreaSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPressureState())
  const [running, setRunning] = useState(false)
  const [force, setForce] = useState(100)
  const [area, setArea] = useState(10)
  const [version, setVersion] = useState(0)

  const pressure = calcPressure(force, area)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepPressure(stateRef.current, dt, running)
      const st = stateRef.current
      const fs = fontPx(13, w, h)
      const depth = st.pressDepth

      ctx.fillStyle = '#f7f9fb'
      ctx.fillRect(0, 0, w, h)

      const surfaceY = h * 0.62
      const blockW = Math.min(w * 0.35, 200)
      const blockH = 36
      const blockX = (w - blockW) / 2
      const blockY = h * 0.22 - depth * 28

      ctx.fillStyle = '#85929e'
      roundRect(ctx, blockX, blockY, blockW, blockH, 6)
      ctx.fill()
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 2
      roundRect(ctx, blockX, blockY, blockW, blockH, 6)
      ctx.stroke()

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`F = ${force} N`, blockX + blockW / 2, blockY - 14)

      const contactW = Math.max(20, Math.min(blockW * 0.85, area * 4.5))
      const contactX = blockX + (blockW - contactW) / 2
      const intensity = Math.min(1, pressure / 40)
      ctx.fillStyle = `rgba(231, 76, 60, ${0.25 + intensity * 0.65})`
      ctx.fillRect(contactX, surfaceY - 4, contactW, 8)

      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(w * 0.08, surfaceY)
      ctx.lineTo(w * 0.92, surfaceY)
      ctx.stroke()

      const nailMode = area < 8
      if (nailMode) {
        const nx = w * 0.72
        ctx.fillStyle = '#95a5a6'
        ctx.beginPath()
        ctx.moveTo(nx, surfaceY - 60)
        ctx.lineTo(nx - 6, surfaceY)
        ctx.lineTo(nx + 6, surfaceY)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#5d6d7e'
        ctx.font = `${fs}px Roboto, sans-serif`
        ctx.fillText('Sharp nail — small area', nx, surfaceY - 68)
      } else {
        ctx.fillStyle = '#3498db'
        roundRect(ctx, w * 0.58, surfaceY - 28, w * 0.28, 22, 6)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `${fs}px Roboto, sans-serif`
        ctx.fillText('Wide shoe — large area', w * 0.72, surfaceY - 16)
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`P = F / A = ${pressure.toFixed(1)} N/cm²`, w / 2, h - 40)
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText('Same force on smaller area → higher pressure', w / 2, h - 18)
    },
    [area, force, pressure, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Pressure = Force ÷ Area"
      subtitle="Spread force over area to see pressure change"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPressureState()
        setForce(100)
        setArea(10)
        setRunning(false)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Variables">
            <ControlHint>Press Play to animate pushing down. Compare nail vs shoe contact area.</ControlHint>
            <ControlSlider
              label="Force (F)"
              value={force}
              min={20}
              max={200}
              step={5}
              display={`${force} N`}
              onChange={setForce}
            />
            <ControlSlider
              label="Contact area (A)"
              value={area}
              min={1}
              max={50}
              step={1}
              display={`${area} cm²`}
              onChange={setArea}
            />
          </ControlSection>
          <ControlSection title="Result">
            <ControlStats>
              <ControlStat label="Pressure" value={`${pressure.toFixed(1)} N/cm²`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
