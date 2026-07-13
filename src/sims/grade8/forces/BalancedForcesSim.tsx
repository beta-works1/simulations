import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

export interface BalancedForcesState {
  position: number
  velocity: number
  time: number
}

export function createBalancedForcesState(): BalancedForcesState {
  return { position: 0, velocity: 0, time: 0 }
}

/** F_net = F_right − F_left; a = F_net / mass — unchanged core model. */
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

type Layout = {
  cx: number
  cy: number
  box: number
  leftTip: { x: number; y: number }
  rightTip: { x: number; y: number }
  massHandle: { x: number; y: number; r: number }
  arrowScale: number
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 1 | -1,
  len: number,
  color: string,
  hover: boolean,
) {
  const tip = x + dir * len
  drawHoverHalo(ctx, tip, y, 16, hover)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = hover ? 5.5 : 4
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
  // Drag knob on tip
  ctx.beginPath()
  ctx.arc(tip, y, hover ? 8 : 6, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
  return { tipX: tip, tipY: y }
}

export function BalancedForcesSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createBalancedForcesState())
  const paramsRef = useRef({ fLeft: 50, fRight: 50, mass: 5 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [fLeft, setFLeft] = useState(50)
  const [fRight, setFRight] = useState(50)
  const [mass, setMass] = useState(5)
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ fNet: 0, accel: 0 })

  paramsRef.current = { fLeft, fRight, mass }

  useEffect(() => {
    const id = window.setInterval(() => {
      const { fLeft: L, fRight: R, mass: m } = paramsRef.current
      setReadout({ fNet: R - L, accel: (R - L) / m })
      // Keep sliders in sync after canvas drags
      setFLeft(Math.round(paramsRef.current.fLeft))
      setFRight(Math.round(paramsRef.current.fRight))
      setMass(Math.round(paramsRef.current.mass))
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.leftTip.x, pt.y - L.leftTip.y) < 22) return 'left'
      if (Math.hypot(pt.x - L.rightTip.x, pt.y - L.rightTip.y) < 22) return 'right'
      if (Math.hypot(pt.x - L.massHandle.x, pt.y - L.massHandle.y) < L.massHandle.r + 10)
        return 'mass'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      hintShown.current = false
      const L = layoutRef.current
      if (!L) return
      const p = paramsRef.current
      if (id === 'left') {
        const len = Math.max(8, L.cx - L.box / 2 - 8 - pt.x)
        p.fLeft = clamp((len / L.arrowScale) * 50, 0, 100)
      } else if (id === 'right') {
        const len = Math.max(8, pt.x - (L.cx + L.box / 2 + 8))
        p.fRight = clamp((len / L.arrowScale) * 50, 0, 100)
      } else if (id === 'mass') {
        // Drag vertically on block: up = lighter, down = heavier
        const t = clamp((pt.y - (L.cy - 40)) / 80, 0, 1)
        p.mass = clamp(1 + t * 19, 1, 20)
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const { fLeft: L, fRight: R, mass: m } = paramsRef.current
      if (dt > 0 && running) stateRef.current = stepBalancedForces(stateRef.current, dt, L, R, m)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const fNet = R - L
      const hover = hoverRef.current

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
      drawLabelPill(ctx, 'floor', w * 0.08, floorY + 22, {
        fontSize: Math.max(9, fs - 2),
        bold: false,
        bg: 'rgba(255,255,255,0.65)',
      })

      const cx = w * 0.5 + s.position * w * 0.28
      const cy = floorY - 36
      const box = Math.min(w, h) * (0.07 + m * 0.004)
      drawHoverHalo(ctx, cx, cy, box * 0.85, hover === 'mass')
      ctx.fillStyle = '#5dade2'
      ctx.fillRect(cx - box / 2, cy - box / 2, box, box)
      ctx.strokeStyle = hover === 'mass' ? '#2980b9' : '#2c3e50'
      ctx.lineWidth = hover === 'mass' ? 3 : 2
      ctx.strokeRect(cx - box / 2, cy - box / 2, box, box)
      drawValueChip(ctx, 'm', `${m.toFixed(0)} kg`, cx, cy, { fontSize: Math.max(10, fs - 1) })

      const arrowScale = Math.min(w * 0.14, 90) * (0.4 + Math.max(L, R) / 120)
      const leftStart = cx - box / 2 - 8
      const rightStart = cx + box / 2 + 8
      const left = drawArrow(ctx, leftStart, cy, -1, arrowScale * (L / 50), '#e74c3c', hover === 'left')
      const right = drawArrow(ctx, rightStart, cy, 1, arrowScale * (R / 50), '#27ae60', hover === 'right')

      drawValueChip(ctx, 'F←', `${L.toFixed(0)} N`, (leftStart + left.tipX) / 2, cy - 22, {
        fontSize: Math.max(10, fs - 1),
      })
      drawValueChip(ctx, 'F→', `${R.toFixed(0)} N`, (rightStart + right.tipX) / 2, cy - 22, {
        fontSize: Math.max(10, fs - 1),
      })

      layoutRef.current = {
        cx,
        cy,
        box,
        leftTip: { x: left.tipX, y: cy },
        rightTip: { x: right.tipX, y: cy },
        massHandle: { x: cx, y: cy, r: box / 2 },
        arrowScale,
      }

      const verdict =
        Math.abs(fNet) < 1
          ? 'Balanced — no acceleration'
          : fNet > 0
            ? 'Unbalanced — accelerates right'
            : 'Unbalanced — accelerates left'
      drawLabelPill(ctx, verdict, w / 2, h * 0.12, { fontSize: fs + 1 })
      drawValueChip(ctx, 'F_net', `${fNet.toFixed(0)} N`, w / 2 - 70, h * 0.12 + fs + 18, {
        fontSize: fs,
      })
      drawValueChip(ctx, 'a', `${(fNet / m).toFixed(1)} m/s²`, w / 2 + 70, h * 0.12 + fs + 18, {
        fontSize: fs,
      })

      if (hintShown.current) {
        drawHint(ctx, 'drag arrow tips · drag block for mass', w / 2, h - 18, w, h)
      }
    },
    [running],
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
        paramsRef.current = { fLeft: 50, fRight: 50, mass: 5 }
        setFLeft(50)
        setFRight(50)
        setMass(5)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Forces">
            <ControlHint>Drag arrow tips on the canvas, or use sliders.</ControlHint>
            <ControlSlider
              label="Left force"
              value={fLeft}
              min={0}
              max={100}
              step={5}
              display={`${fLeft} N`}
              onChange={(v) => {
                setFLeft(v)
                paramsRef.current.fLeft = v
              }}
            />
            <ControlSlider
              label="Right force"
              value={fRight}
              min={0}
              max={100}
              step={5}
              display={`${fRight} N`}
              onChange={(v) => {
                setFRight(v)
                paramsRef.current.fRight = v
              }}
            />
            <ControlSlider
              label="Mass"
              value={mass}
              min={1}
              max={20}
              step={1}
              display={`${mass} kg`}
              onChange={(v) => {
                setMass(v)
                paramsRef.current.mass = v
              }}
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
