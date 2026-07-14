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

      ctx.fillStyle = '#f7f4ef'
      ctx.fillRect(0, 0, w, h)

      // Figure: head + torso + arm (clipped silhouettes, soft fills that stay in shape)
      const torsoX = w * 0.48
      const torsoY = h * 0.52
      drawPerson(ctx, torsoX, torsoY, w, h)

      const receptor = { x: w * 0.16, y: h * 0.7 }
      const spine = { x: torsoX, y: h * 0.48 }
      const brain = { x: torsoX + w * 0.02, y: h * 0.18 }
      const effector = { x: w * 0.86, y: h * 0.68 }

      // Wire path only — thin stroked line, no fat glow bleed
      const path: Pt[] = viaBrain
        ? [receptor, spine, brain, { x: spine.x, y: spine.y + 8 }, effector]
        : [receptor, spine, effector]

      ctx.save()
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = viaBrain ? '#2980b9' : '#1e8449'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (const p of path.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.stroke()
      ctx.restore()

      // Spinal column (single label above)
      ctx.fillStyle = '#95a5a6'
      const colW = 14
      const colTop = h * 0.28
      const colH = h * 0.4
      roundRectFill(ctx, spine.x - colW / 2, colTop, colW, colH, 4)
      drawLabelPill(ctx, 'Spinal cord', spine.x, colTop - 14, { fontSize: Math.max(10, fs - 1) })

      // Brain picture (always visible; bright when route uses it)
      drawMiniBrain(ctx, brain.x, brain.y, Math.min(w, h) * 0.07, viaBrain || hover === 'brain-toggle')
      drawLabelPill(ctx, viaBrain ? 'Brain (on pathway)' : 'Brain (bypassed)', brain.x, brain.y - 36, {
        fontSize: Math.max(10, fs - 1),
        bg: viaBrain ? 'rgba(41,128,185,0.15)' : 'rgba(255,255,255,0.9)',
      })

      // Receptor node
      const nodeR = Math.max(16, fs + 2)
      drawHoverHalo(ctx, receptor.x, receptor.y, nodeR + 8, hover === 'stimulate')
      ctx.beginPath()
      ctx.arc(receptor.x, receptor.y, nodeR, 0, Math.PI * 2)
      ctx.fillStyle = '#e67e22'
      ctx.fill()
      ctx.strokeStyle = hover === 'stimulate' ? '#1a252f' : '#fff'
      ctx.lineWidth = 2.5
      ctx.stroke()
      drawLabelPill(ctx, 'Receptor', receptor.x, receptor.y - nodeR - 16, {
        fontSize: Math.max(10, fs - 1),
      })
      drawLabelPill(ctx, 'tap to stimulate', receptor.x, receptor.y + nodeR + 16, {
        fontSize: Math.max(9, fs - 2),
        bold: false,
      })

      // Effector (muscle / hand)
      ctx.beginPath()
      ctx.arc(effector.x, effector.y, nodeR, 0, Math.PI * 2)
      ctx.fillStyle = '#27ae60'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.stroke()
      drawLabelPill(ctx, 'Effector (muscle)', effector.x, effector.y - nodeR - 16, {
        fontSize: Math.max(10, fs - 1),
      })

      // Mid junction (relay) — no second "spinal cord" text on the node
      ctx.beginPath()
      ctx.arc(spine.x, spine.y, nodeR * 0.85, 0, Math.PI * 2)
      ctx.fillStyle = '#2f6fed'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      layoutRef.current = {
        stimulate: { ...receptor, r: nodeR },
        brainToggle: { ...brain, r: Math.min(w, h) * 0.08 },
      }

      if (s.fired) {
        const segs = path.length - 1
        const t = s.progress * segs
        const i = Math.min(segs - 1, Math.floor(t))
        const f = t - i
        const a = path[i]
        const b = path[i + 1]
        const x = a.x + (b.x - a.x) * f
        const y = a.y + (b.y - a.y) * f

        // Completed segments — thin gold trail only
        ctx.strokeStyle = '#f1c40f'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        for (let k = 1; k <= i; k++) ctx.lineTo(path[k].x, path[k].y)
        ctx.lineTo(x, y)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.fill()
        ctx.strokeStyle = '#b7950b'
        ctx.lineWidth = 1.5
        ctx.stroke()

        drawValueChip(ctx, 'signal', `${Math.round(s.progress * 100)}%`, x, y - 22, {
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })

        if (s.progress >= 1) {
          drawLabelPill(
            ctx,
            viaBrain ? 'Slower — signal went via the brain' : 'Fast spinal reflex — brain skipped',
            w / 2,
            h - 28,
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
              Tap the orange receptor on the canvas. Tap the brain to include or skip it.
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

function roundRectFill(
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
  ctx.fill()
}

function drawPerson(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.save()
  // Torso
  ctx.fillStyle = 'rgba(214, 188, 160, 0.55)'
  ctx.beginPath()
  ctx.ellipse(cx, cy + h * 0.02, w * 0.07, h * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head
  ctx.beginPath()
  ctx.arc(cx, cy - h * 0.28, Math.min(w, h) * 0.055, 0, Math.PI * 2)
  ctx.fill()
  // Left arm toward receptor
  ctx.strokeStyle = 'rgba(214, 188, 160, 0.9)'
  ctx.lineWidth = Math.max(8, Math.min(w, h) * 0.018)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.04, cy - h * 0.05)
  ctx.quadraticCurveTo(cx - w * 0.18, cy + h * 0.05, w * 0.18, h * 0.68)
  ctx.stroke()
  // Right arm toward effector
  ctx.beginPath()
  ctx.moveTo(cx + w * 0.04, cy - h * 0.02)
  ctx.quadraticCurveTo(cx + w * 0.22, cy + h * 0.08, w * 0.84, h * 0.66)
  ctx.stroke()
  ctx.restore()
}

/** Small anatomical brain glyph (clipped fill). */
function drawMiniBrain(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  active: boolean,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(r / 40, r / 40)
  ctx.beginPath()
  // silhouette
  ctx.moveTo(-28, 0)
  ctx.bezierCurveTo(-28, -28, -8, -36, 8, -32)
  ctx.bezierCurveTo(28, -28, 36, -8, 32, 8)
  ctx.bezierCurveTo(30, 18, 18, 22, 10, 18)
  ctx.bezierCurveTo(18, 28, 14, 38, 2, 36)
  ctx.bezierCurveTo(-6, 40, -10, 28, -8, 20)
  ctx.bezierCurveTo(-16, 24, -28, 16, -28, 0)
  ctx.closePath()
  ctx.fillStyle = active ? '#f5cba7' : '#e8d5c0'
  ctx.fill()
  ctx.strokeStyle = active ? '#2980b9' : '#a67c52'
  ctx.lineWidth = active ? 2.5 : 1.8
  ctx.stroke()
  // simple lobe divide
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-4, -24)
  ctx.quadraticCurveTo(0, -4, -6, 12)
  ctx.stroke()
  ctx.restore()
}
