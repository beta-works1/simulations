import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack, ControlToggle } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

export interface ReflexState {
  progress: number
  viaBrain: boolean
  fired: boolean
}

export function createReflexState(viaBrain = false): ReflexState {
  return { progress: 0, viaBrain, fired: false }
}

export function stepReflex(s: ReflexState, dt: number, playing: boolean): ReflexState {
  if (!playing || !s.fired) return s
  const speed = s.viaBrain ? 0.32 : 0.62
  return { ...s, progress: Math.min(1, s.progress + dt * speed) }
}

type Pt = { x: number; y: number }

type HitId = 'stimulate' | 'brain-toggle' | null

/** Sample a cubic Bézier for signal animation. */
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

type Curve = { a: Pt; c1: Pt; c2: Pt; b: Pt }

export function ReflexArcSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createReflexState(false))
  const layoutRef = useRef<{
    stimulate: Pt & { r: number }
    brainToggle: Pt & { r: number }
  } | null>(null)
  const hoverRef = useRef<HitId>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(false)
  const [viaBrain, setViaBrain] = useState(false)
  const [version, setVersion] = useState(0)

  const fire = () => {
    hintShown.current = false
    stateRef.current = { ...createReflexState(viaBrain), fired: true, progress: 0 }
    setRunning(true)
    setVersion((v) => v + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.stimulate.x, pt.y - L.stimulate.y) < L.stimulate.r + 10)
        return 'stimulate'
      if (Math.hypot(pt.x - L.brainToggle.x, pt.y - L.brainToggle.y) < L.brainToggle.r + 8)
        return 'brain-toggle'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id as HitId
    },
    onTap: (id) => {
      if (id === 'stimulate') fire()
      if (id === 'brain-toggle') {
        setViaBrain((v) => {
          const next = !v
          stateRef.current = createReflexState(next)
          setRunning(false)
          setVersion((n) => n + 1)
          return next
        })
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      stateRef.current.viaBrain = viaBrain
      if (dt > 0) stateRef.current = stepReflex(stateRef.current, dt, running)
      const s = stateRef.current
      const fs = fontPx(12, w, h)
      const hover = hoverRef.current

      ctx.fillStyle = '#f5f7fa'
      ctx.fillRect(0, 0, w, h)

      const receptor = { x: w * 0.14, y: h * 0.68 }
      const spine = { x: w * 0.48, y: h * 0.5 }
      const brain = { x: w * 0.52, y: h * 0.2 }
      const effector = { x: w * 0.86, y: h * 0.68 }
      const nodeR = Math.max(15, fs + 1)

      // Soft body silhouette (smooth ellipses only — no thick jagged arms)
      ctx.fillStyle = 'rgba(210, 185, 160, 0.28)'
      ctx.beginPath()
      ctx.ellipse(spine.x, h * 0.52, w * 0.08, h * 0.26, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(brain.x - 4, brain.y + 8, Math.min(w, h) * 0.05, 0, Math.PI * 2)
      ctx.fill()

      // Smooth nerve curves (PhET-style)
      const afferent: Curve = {
        a: receptor,
        c1: { x: w * 0.28, y: h * 0.72 },
        c2: { x: w * 0.38, y: h * 0.62 },
        b: spine,
      }
      const toBrain: Curve = {
        a: spine,
        c1: { x: spine.x - 10, y: h * 0.36 },
        c2: { x: brain.x - 20, y: h * 0.28 },
        b: brain,
      }
      const fromBrain: Curve = {
        a: brain,
        c1: { x: brain.x + 10, y: h * 0.3 },
        c2: { x: spine.x + 16, y: h * 0.38 },
        b: spine,
      }
      const efferent: Curve = {
        a: spine,
        c1: { x: w * 0.6, y: h * 0.58 },
        c2: { x: w * 0.72, y: h * 0.7 },
        b: effector,
      }

      const curves: Curve[] = viaBrain
        ? [afferent, toBrain, fromBrain, efferent]
        : [afferent, efferent]

      const pathColor = viaBrain ? '#2980b9' : '#1e8449'
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = pathColor
      ctx.lineWidth = 3
      for (const c of curves) {
        ctx.beginPath()
        ctx.moveTo(c.a.x, c.a.y)
        ctx.bezierCurveTo(c.c1.x, c.c1.y, c.c2.x, c.c2.y, c.b.x, c.b.y)
        ctx.stroke()
      }
      ctx.restore()

      // Spinal column (smooth rounded capsule)
      const colW = 16
      const colTop = h * 0.3
      const colH = h * 0.38
      ctx.fillStyle = '#aeb6bf'
      capsule(ctx, spine.x - colW / 2, colTop, colW, colH, 8)
      ctx.fill()
      // Single label — to the right, not overlapping the node
      drawLabelPill(ctx, 'Spinal cord', spine.x + 48, colTop + 18, {
        align: 'left',
        fontSize: Math.max(10, fs - 1),
      })

      // Brain glyph (smooth)
      drawSmoothBrain(ctx, brain.x, brain.y, Math.min(w, h) * 0.075, viaBrain || hover === 'brain-toggle')
      // Label above brain, offset so it doesn't cover the graphic
      drawLabelPill(ctx, viaBrain ? 'Brain (on path)' : 'Brain (tap to include)', brain.x, brain.y - 42, {
        fontSize: Math.max(10, fs - 1),
        bg: viaBrain ? 'rgba(41,128,185,0.12)' : '#fff',
      })

      // Receptor
      drawHoverHalo(ctx, receptor.x, receptor.y, nodeR + 8, hover === 'stimulate')
      ctx.beginPath()
      ctx.arc(receptor.x, receptor.y, nodeR, 0, Math.PI * 2)
      ctx.fillStyle = '#e67e22'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.stroke()
      drawLabelPill(ctx, 'Receptor', receptor.x, receptor.y - nodeR - 18, {
        fontSize: Math.max(10, fs - 1),
      })
      drawLabelPill(ctx, 'tap to fire', receptor.x, receptor.y + nodeR + 18, {
        fontSize: Math.max(9, fs - 2),
        bold: false,
      })

      // Effector
      ctx.beginPath()
      ctx.arc(effector.x, effector.y, nodeR, 0, Math.PI * 2)
      ctx.fillStyle = '#27ae60'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.stroke()
      drawLabelPill(ctx, 'Effector', effector.x, effector.y - nodeR - 18, {
        fontSize: Math.max(10, fs - 1),
      })

      // Relay node on cord (no second spinal label)
      ctx.beginPath()
      ctx.arc(spine.x, spine.y, nodeR * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = '#2f6fed'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      layoutRef.current = {
        stimulate: { ...receptor, r: nodeR },
        brainToggle: { ...brain, r: Math.min(w, h) * 0.085 },
      }

      if (s.fired) {
        const n = curves.length
        const tAll = s.progress * n
        const i = Math.min(n - 1, Math.floor(tAll))
        const f = tAll - i
        const c = curves[i]
        const pos = cubic(c.a, c.c1, c.c2, c.b, f)

        // Completed curves in gold
        ctx.save()
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#f1c40f'
        ctx.lineWidth = 3
        for (let k = 0; k < i; k++) {
          const ck = curves[k]
          ctx.beginPath()
          ctx.moveTo(ck.a.x, ck.a.y)
          ctx.bezierCurveTo(ck.c1.x, ck.c1.y, ck.c2.x, ck.c2.y, ck.b.x, ck.b.y)
          ctx.stroke()
        }
        // Partial current curve
        ctx.beginPath()
        ctx.moveTo(c.a.x, c.a.y)
        const steps = Math.max(2, Math.floor(f * 24))
        for (let s = 1; s <= steps; s++) {
          const p = cubic(c.a, c.c1, c.c2, c.b, (s / steps) * f)
          ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
        ctx.restore()

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.fill()
        ctx.strokeStyle = '#b7950b'
        ctx.lineWidth = 1.5
        ctx.stroke()

        drawValueChip(ctx, '', `${Math.round(s.progress * 100)}%`, pos.x, pos.y - 20, {
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })

        if (s.progress >= 1) {
          drawLabelPill(
            ctx,
            viaBrain ? 'Slower — path went through the brain' : 'Fast reflex — brain skipped',
            w / 2,
            h - 22,
            {
              fontSize: fs,
              bg: viaBrain ? 'rgba(41,128,185,0.92)' : 'rgba(39,174,96,0.92)',
              fg: '#fff',
            },
          )
        }
      } else if (hintShown.current) {
        drawHint(ctx, 'tap receptor to fire · tap brain to toggle pathway', w / 2, h - 16, w, h)
      }
    },
    [running, viaBrain],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Reflex Arc"
      subtitle="Stimulus → receptor → spinal cord → effector (optional brain)"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => {
        if (!stateRef.current.fired) fire()
        else setRunning((r) => !r)
      }}
      onReset={() => {
        stateRef.current = createReflexState(viaBrain)
        setRunning(false)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Pathway">
            <ControlHint>
              Tap the orange receptor to fire. Tap the brain to include or skip it.
            </ControlHint>
            <ControlToggle
              label="Route via brain"
              checked={viaBrain}
              onChange={(v) => {
                setViaBrain(v)
                stateRef.current = createReflexState(v)
                setRunning(false)
                setVersion((n) => n + 1)
              }}
            />
            <ControlStack>
              <button type="button" className="sim-shell-btn is-active" onClick={fire}>
                Stimulate
              </button>
            </ControlStack>
          </ControlSection>
        </>
      }
    />
  )
}

function capsule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawSmoothBrain(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, active: boolean) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(r / 36, r / 36)
  ctx.beginPath()
  ctx.moveTo(-26, 4)
  ctx.bezierCurveTo(-28, -22, -6, -34, 10, -30)
  ctx.bezierCurveTo(28, -26, 34, -6, 30, 10)
  ctx.bezierCurveTo(28, 20, 16, 22, 8, 16)
  ctx.bezierCurveTo(14, 28, 10, 36, 0, 34)
  ctx.bezierCurveTo(-8, 36, -10, 26, -8, 18)
  ctx.bezierCurveTo(-18, 22, -28, 14, -26, 4)
  ctx.closePath()
  ctx.fillStyle = active ? '#f2d0b0' : '#e5d0b8'
  ctx.fill()
  ctx.strokeStyle = active ? '#2980b9' : '#8d6e4c'
  ctx.lineWidth = active ? 2.4 : 1.8
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 1.1
  ctx.beginPath()
  ctx.moveTo(-2, -22)
  ctx.quadraticCurveTo(2, -2, -4, 12)
  ctx.stroke()
  ctx.restore()
}
