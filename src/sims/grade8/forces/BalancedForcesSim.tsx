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

export interface BalancedForcesState {
  position: number
  velocity: number
  time: number
}

export function createBalancedForcesState(): BalancedForcesState {
  return { position: 0, velocity: 0, time: 0 }
}

/** F_net = F_right − F_left; a = F_net / mass */
export function stepBalancedForces(
  s: BalancedForcesState,
  dt: number,
  fLeft: number,
  fRight: number,
  mass: number,
): BalancedForcesState {
  const fNet = fRight - fLeft
  const accel = fNet / mass
  let { velocity, position } = s
  velocity += accel * dt
  velocity *= 0.992
  position += velocity * dt * 28
  position = Math.max(-1, Math.min(1, position))
  return { ...s, position, velocity, time: s.time + dt }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 1 | -1,
  len: number,
  color: string,
  label: string,
  fs: number,
) {
  const tip = x + dir * len
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(tip, y)
  ctx.stroke()
  const head = 12
  ctx.beginPath()
  ctx.moveTo(tip, y)
  ctx.lineTo(tip - dir * head, y - head * 0.55)
  ctx.lineTo(tip - dir * head, y + head * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(label, (x + tip) / 2, y - 18)
}

export function BalancedForcesSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createBalancedForcesState())
  const [running, setRunning] = useState(true)
  const [fLeft, setFLeft] = useState(50)
  const [fRight, setFRight] = useState(50)
  const [mass, setMass] = useState(5)
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ fNet: 0, accel: 0 })

  useEffect(() => {
    const id = window.setInterval(() => {
      const fNet = fRight - fLeft
      setReadout({ fNet, accel: fNet / mass })
    }, 160)
    return () => clearInterval(id)
  }, [fLeft, fRight, mass])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running)
        stateRef.current = stepBalancedForces(stateRef.current, dt, fLeft, fRight, mass)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const fNet = fRight - fLeft

      ctx.fillStyle = '#f7f9fb'
      ctx.fillRect(0, 0, w, h)

      const floorY = h * 0.72
      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(w * 0.05, floorY)
      ctx.lineTo(w * 0.95, floorY)
      ctx.stroke()
      for (let i = 0; i < 12; i++) {
        const hx = w * 0.05 + i * ((w * 0.9) / 11)
        ctx.beginPath()
        ctx.moveTo(hx, floorY)
        ctx.lineTo(hx - 8, floorY + 12)
        ctx.stroke()
      }

      const cx = w * 0.5 + s.position * w * 0.28
      const cy = floorY - 36
      const box = Math.min(w, h) * 0.09
      ctx.fillStyle = '#5dade2'
      ctx.fillRect(cx - box / 2, cy - box / 2, box, box)
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 2
      ctx.strokeRect(cx - box / 2, cy - box / 2, box, box)

      const arrowLen = Math.min(w * 0.14, 90) * (0.4 + Math.max(fLeft, fRight) / 120)
      drawArrow(ctx, cx - box / 2 - 8, cy, -1, arrowLen * (fLeft / 50), '#e74c3c', `${fLeft} N`, fs)
      drawArrow(ctx, cx + box / 2 + 8, cy, 1, arrowLen * (fRight / 50), '#27ae60', `${fRight} N`, fs)

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      const verdict =
        Math.abs(fNet) < 1 ? 'Balanced — no acceleration' : fNet > 0 ? 'Net force → right' : 'Net force ← left'
      ctx.fillText(verdict, w / 2, h * 0.14)
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText(`F_net = ${fNet.toFixed(0)} N · a = ${(fNet / mass).toFixed(1)} m/s²`, w / 2, h * 0.14 + fs + 10)
      ctx.fillText('Equal forces → object stays at rest or constant velocity', w / 2, h - 12)
    },
    [fLeft, fRight, mass, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Balanced & Unbalanced Forces"
      subtitle="Net force determines whether an object accelerates"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createBalancedForcesState()
        setFLeft(50)
        setFRight(50)
        setMass(5)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Forces">
            <ControlHint>Adjust left and right forces. Unequal forces produce acceleration.</ControlHint>
            <ControlSlider
              label="Left force"
              value={fLeft}
              min={0}
              max={100}
              step={5}
              display={`${fLeft} N`}
              onChange={setFLeft}
            />
            <ControlSlider
              label="Right force"
              value={fRight}
              min={0}
              max={100}
              step={5}
              display={`${fRight} N`}
              onChange={setFRight}
            />
            <ControlSlider
              label="Mass"
              value={mass}
              min={1}
              max={20}
              step={1}
              display={`${mass} kg`}
              onChange={setMass}
            />
          </ControlSection>
          <ControlSection title="Physics">
            <ControlStats>
              <ControlStat label="F_net" value={`${readout.fNet.toFixed(0)} N`} />
              <ControlStat label="Acceleration" value={`${readout.accel.toFixed(1)} m/s²`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
