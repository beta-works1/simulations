import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect, withShadow } from '../../shared/drawHelpers'
import { drawFaintGrid } from '../../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

export interface HydraulicState {
  liftHeight: number
  time: number
}

export function createHydraulicState(): HydraulicState {
  return { liftHeight: 0, time: 0 }
}

/** Pascal: F1/A1 = F2/A2 → F2 = F1 × (A2/A1) — unchanged. */
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

type Layout = {
  small: { x: number; y: number; r: number }
  large: { x: number; y: number; r: number }
  a1Handle: { x: number; y: number }
  a2Handle: { x: number; y: number }
}

export function HydraulicLiftSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createHydraulicState())
  const paramsRef = useRef({ f1: 50, a1: 4, a2: 40 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [f1, setF1] = useState(50)
  const [a1, setA1] = useState(4)
  const [a2, setA2] = useState(40)
  const [version, setVersion] = useState(0)
  const [f2, setF2] = useState(calcF2(50, 4, 40))

  paramsRef.current = { f1, a1, a2 }

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = paramsRef.current
      setF1(Math.round(p.f1))
      setA1(Math.round(p.a1))
      setA2(Math.round(p.a2))
      setF2(calcF2(p.f1, p.a1, p.a2))
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.small.x, pt.y - L.small.y) < L.small.r + 16) return 'f1'
      if (Math.abs(pt.x - L.a1Handle.x) < 16 && Math.abs(pt.y - L.a1Handle.y) < 16) return 'a1'
      if (Math.abs(pt.x - L.a2Handle.x) < 16 && Math.abs(pt.y - L.a2Handle.y) < 16) return 'a2'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt, size) => {
      hintShown.current = false
      const p = paramsRef.current
      if (id === 'f1') {
        // Push down = more force
        p.f1 = clamp(10 + ((size.h * 0.45 - pt.y) / (size.h * 0.3)) * 190, 10, 200)
      } else if (id === 'a1') {
        p.a1 = clamp(((pt.x - size.w * 0.1) / (size.w * 0.3)) * 20, 1, 20)
      } else if (id === 'a2') {
        p.a2 = clamp(10 + ((pt.x - size.w * 0.5) / (size.w * 0.4)) * 70, 10, 80)
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const { f1: F1, a1: A1, a2: A2 } = paramsRef.current
      if (dt > 0 && running)
        stateRef.current = stepHydraulic(stateRef.current, dt, F1, A1, A2, LOAD_WEIGHT, running)
      const st = stateRef.current
      const fs = fontPx(12, w, h)
      const outF2 = calcF2(F1, A1, A2)
      const canLift = outF2 >= LOAD_WEIGHT
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'force')
      drawFaintGrid(ctx, w, h)

      const baseY = h * 0.78
      const smallX = w * 0.22
      const largeX = w * 0.72
      const smallR = Math.sqrt(A1) * 5 + 12
      const largeR = Math.sqrt(A2) * 5 + 18

      ctx.fillStyle = 'rgba(52,152,219,0.35)'
      ctx.fillRect(w * 0.12, baseY - 20, w * 0.76, 24)
      ctx.strokeStyle = '#2980b9'
      ctx.lineWidth = 2
      ctx.strokeRect(w * 0.12, baseY - 20, w * 0.76, 24)
      drawLabelPill(ctx, 'fluid', w / 2, baseY - 32, { fontSize: Math.max(9, fs - 2) })

      ctx.fillStyle = 'rgba(41,128,185,0.55)'
      ctx.beginPath()
      ctx.ellipse(smallX, baseY - 8, smallR, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(largeX, baseY - 8, largeR, 18, 0, 0, Math.PI * 2)
      ctx.fill()

      const pistonSmallY = baseY - 28 - F1 * 0.08 - (running ? Math.sin(st.time * 3) * 4 : 0)
      drawHoverHalo(ctx, smallX, pistonSmallY - 20, smallR, hover === 'f1')
      withShadow(ctx, () => {
        ctx.fillStyle = '#7f8c8d'
        roundRect(ctx, smallX - smallR * 0.55, pistonSmallY - 40, smallR * 1.1, 40, 4)
        ctx.fill()
      })
      ctx.strokeStyle = hover === 'f1' ? '#27ae60' : 'transparent'
      ctx.lineWidth = 3
      roundRect(ctx, smallX - smallR * 0.55, pistonSmallY - 40, smallR * 1.1, 40, 4)
      ctx.stroke()

      const liftOffset = st.liftHeight * 55
      const pistonLargeY = baseY - 36 - liftOffset
      withShadow(ctx, () => {
        ctx.fillStyle = '#7f8c8d'
        roundRect(ctx, largeX - largeR * 0.55, pistonLargeY - 36, largeR * 1.1, 36, 4)
        ctx.fill()
        ctx.fillStyle = '#e67e22'
        roundRect(ctx, largeX - largeR * 0.7, pistonLargeY - 70, largeR * 1.4, 28, 4)
        ctx.fill()
      })
      drawLabelPill(ctx, `Load ${LOAD_WEIGHT} N`, largeX, pistonLargeY - 84, { fontSize: fs })

      drawValueChip(ctx, 'F₁', `${F1.toFixed(0)} N`, smallX, h * 0.12, { fontSize: fs, accent: true })
      drawValueChip(ctx, 'A₁', `${A1.toFixed(0)} cm²`, smallX, h * 0.12 + fs + 16, { fontSize: fs })
      drawValueChip(ctx, 'F₂', `${outF2.toFixed(0)} N`, largeX, h * 0.12, { fontSize: fs, accent: true })
      drawValueChip(ctx, 'A₂', `${A2.toFixed(0)} cm²`, largeX, h * 0.12 + fs + 16, { fontSize: fs })

      // Area handles
      drawHoverHalo(ctx, smallX + smallR + 12, baseY - 8, 12, hover === 'a1')
      drawHoverHalo(ctx, largeX + largeR + 12, baseY - 8, 12, hover === 'a2')
      ctx.fillStyle = '#2980b9'
      ctx.beginPath()
      ctx.arc(smallX + smallR + 12, baseY - 8, 7, 0, Math.PI * 2)
      ctx.arc(largeX + largeR + 12, baseY - 8, 7, 0, Math.PI * 2)
      ctx.fill()

      layoutRef.current = {
        small: { x: smallX, y: pistonSmallY - 20, r: smallR },
        large: { x: largeX, y: pistonLargeY - 20, r: largeR },
        a1Handle: { x: smallX + smallR + 12, y: baseY - 8 },
        a2Handle: { x: largeX + largeR + 12, y: baseY - 8 },
      }

      drawLabelPill(
        ctx,
        canLift ? 'F₂ ≥ load — lifting!' : 'F₂ < load — push harder or enlarge A₂/A₁',
        w / 2,
        h - 32,
        {
          fontSize: fs,
          bg: canLift ? 'rgba(39,174,96,0.2)' : 'rgba(192,57,43,0.15)',
        },
      )
      if (hintShown.current) drawHint(ctx, 'drag small piston for F₁ · drag blue knobs for area', w / 2, h - 12, w, h)
    },
    [running],
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
        paramsRef.current = { f1: 50, a1: 4, a2: 40 }
        setF1(50)
        setA1(4)
        setA2(40)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Small piston">
            <ControlHint>Drag the small piston down to increase F₁.</ControlHint>
            <ControlSlider
              label="F₁ (input force)"
              value={f1}
              min={10}
              max={200}
              step={5}
              display={`${f1} N`}
              onChange={(v) => {
                setF1(v)
                paramsRef.current.f1 = v
              }}
            />
            <ControlSlider
              label="A₁ (small area)"
              value={a1}
              min={1}
              max={20}
              step={1}
              display={`${a1} cm²`}
              onChange={(v) => {
                setA1(v)
                paramsRef.current.a1 = v
              }}
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
              onChange={(v) => {
                setA2(v)
                paramsRef.current.a2 = v
              }}
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
