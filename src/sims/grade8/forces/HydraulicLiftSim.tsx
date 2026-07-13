import { useCallback, useEffect, useRef, useState } from 'react'
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

export interface HydraulicState {
  liftHeight: number
  time: number
}

export function createHydraulicState(): HydraulicState {
  return { liftHeight: 0, time: 0 }
}

/** Pascal: F1/A1 = F2/A2 → F2 = F1 × (A2/A1). */
export function calcF2(f1: number, a1: number, a2: number): number {
  return f1 * (a2 / Math.max(0.5, a1))
}

export function stepHydraulic(
  s: HydraulicState,
  dt: number,
  f1: number,
  a1: number,
  a2: number,
  loadWeight: number,
  running: boolean,
): HydraulicState {
  const f2 = calcF2(f1, a1, a2)
  let { liftHeight } = s
  if (running && f2 >= loadWeight) liftHeight = Math.min(1, liftHeight + dt * 0.25)
  else if (running && f2 < loadWeight) liftHeight = Math.max(0, liftHeight - dt * 0.15)
  return { ...s, liftHeight, time: s.time + dt }
}

const LOAD_WEIGHT = 800

export function HydraulicLiftSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createHydraulicState())
  const [running, setRunning] = useState(true)
  const [f1, setF1] = useState(50)
  const [a1, setA1] = useState(4)
  const [a2, setA2] = useState(40)
  const [version, setVersion] = useState(0)
  const [f2, setF2] = useState(calcF2(50, 4, 40))

  useEffect(() => {
    setF2(calcF2(f1, a1, a2))
  }, [f1, a1, a2])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running)
        stateRef.current = stepHydraulic(stateRef.current, dt, f1, a1, a2, LOAD_WEIGHT, running)
      const st = stateRef.current
      const fs = fontPx(12, w, h)
      const outF2 = calcF2(f1, a1, a2)
      const canLift = outF2 >= LOAD_WEIGHT

      ctx.fillStyle = '#f7f9fb'
      ctx.fillRect(0, 0, w, h)

      const baseY = h * 0.78
      const smallX = w * 0.22
      const largeX = w * 0.72
      const smallR = Math.sqrt(a1) * 5 + 12
      const largeR = Math.sqrt(a2) * 5 + 18

      ctx.fillStyle = 'rgba(52,152,219,0.35)'
      ctx.fillRect(w * 0.12, baseY - 20, w * 0.76, 24)
      ctx.strokeStyle = '#2980b9'
      ctx.lineWidth = 2
      ctx.strokeRect(w * 0.12, baseY - 20, w * 0.76, 24)

      ctx.fillStyle = 'rgba(41,128,185,0.55)'
      ctx.beginPath()
      ctx.ellipse(smallX, baseY - 8, smallR, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(largeX, baseY - 8, largeR, 18, 0, 0, Math.PI * 2)
      ctx.fill()

      const pistonSmallY = baseY - 28 - (running ? Math.sin(st.time * 3) * 6 : 0)
      ctx.fillStyle = '#7f8c8d'
      roundRect(ctx, smallX - smallR * 0.55, pistonSmallY - 40, smallR * 1.1, 40, 4)
      ctx.fill()

      const liftOffset = st.liftHeight * 55
      const pistonLargeY = baseY - 36 - liftOffset
      ctx.fillStyle = '#7f8c8d'
      roundRect(ctx, largeX - largeR * 0.55, pistonLargeY - 36, largeR * 1.1, 36, 4)
      ctx.fill()

      ctx.fillStyle = '#e67e22'
      roundRect(ctx, largeX - largeR * 0.7, pistonLargeY - 70, largeR * 1.4, 28, 4)
      ctx.fill()
      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Load', largeX, pistonLargeY - 52)

      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(smallX, pistonSmallY)
      ctx.lineTo(smallX, baseY - 50)
      ctx.moveTo(largeX, pistonLargeY)
      ctx.lineTo(largeX, baseY - 50)
      ctx.stroke()

      drawArrowDown(ctx, smallX, h * 0.18, f1, '#27ae60', fs)
      ctx.fillStyle = '#1a252f'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`F₁ = ${f1} N`, smallX, h * 0.12)
      ctx.fillText(`A₁ = ${a1} cm²`, smallX, h * 0.12 + fs + 4)
      ctx.fillText(`F₂ = ${outF2.toFixed(0)} N`, largeX, h * 0.12)
      ctx.fillText(`A₂ = ${a2} cm²`, largeX, h * 0.12 + fs + 4)

      ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
      ctx.fillStyle = canLift ? '#27ae60' : '#c0392b'
      ctx.fillText(
        canLift ? 'F₂ ≥ load — lifting!' : 'F₂ < load — need more F₁ or larger A₂/A₁',
        w / 2,
        h - 28,
      )
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText('Pascal: F₁/A₁ = F₂/A₂ — pressure transmits through fluid', w / 2, h - 10)
    },
    [a1, a2, f1, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Hydraulic Lift"
      subtitle="Small force on a small piston lifts a heavy load"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createHydraulicState()
        setF1(50)
        setA1(4)
        setA2(40)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Small piston">
            <ControlHint>Increase F₁ or the area ratio A₂/A₁ to generate enough F₂.</ControlHint>
            <ControlSlider
              label="F₁ (input force)"
              value={f1}
              min={10}
              max={200}
              step={5}
              display={`${f1} N`}
              onChange={setF1}
            />
            <ControlSlider
              label="A₁ (small area)"
              value={a1}
              min={1}
              max={20}
              step={1}
              display={`${a1} cm²`}
              onChange={setA1}
            />
          </ControlSection>
          <ControlSection title="Large piston">
            <ControlSlider
              label="A₂ (large area)"
              value={a2}
              min={10}
              max={80}
              step={2}
              display={`${a2} cm²`}
              onChange={setA2}
            />
            <ControlStats>
              <ControlStat label="F₂ (output)" value={`${f2.toFixed(0)} N`} />
              <ControlStat label="Load" value={`${LOAD_WEIGHT} N`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}

function drawArrowDown(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mag: number,
  color: string,
  fs: number,
) {
  const len = 20 + mag * 0.35
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y + len)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y + len)
  ctx.lineTo(x - 8, y + len - 12)
  ctx.lineTo(x + 8, y + len - 12)
  ctx.closePath()
  ctx.fill()
  void fs
}
