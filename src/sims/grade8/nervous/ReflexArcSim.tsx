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

export function ReflexArcSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createReflexState(false))
  const layoutRef = useRef<{ stimulate: Pt & { r: number } } | null>(null)
  const hoverRef = useRef(false)
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
      return Math.hypot(pt.x - L.stimulate.x, pt.y - L.stimulate.y) < L.stimulate.r + 8
        ? 'stimulate'
        : null
    },
    onHoverChange: (id) => {
      hoverRef.current = id === 'stimulate'
    },
    onTap: (id) => {
      if (id === 'stimulate') fire()
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      stateRef.current.viaBrain = viaBrain
      if (dt > 0) stateRef.current = stepReflex(stateRef.current, dt, running)
      const s = stateRef.current
      const fs = fontPx(12, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f4ef')
      bg.addColorStop(1, '#e8e0d4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Body silhouette
      ctx.fillStyle = 'rgba(210, 180, 140, 0.35)'
      ctx.beginPath()
      ctx.ellipse(w * 0.55, h * 0.55, w * 0.12, h * 0.38, 0, 0, Math.PI * 2)
      ctx.fill()

      const receptor = { x: w * 0.14, y: h * 0.72 }
      const spine = { x: w * 0.48, y: h * 0.48 }
      const brain = { x: w * 0.62, y: h * 0.2 }
      const effector = { x: w * 0.86, y: h * 0.7 }
      const path: Pt[] = viaBrain
        ? [receptor, spine, brain, spine, effector]
        : [receptor, spine, effector]
      const labels = viaBrain
        ? ['Receptor', 'Spinal cord', 'Brain', 'Spinal cord', 'Effector']
        : ['Receptor', 'Spinal cord', 'Effector']

      // Path glow trail
      ctx.strokeStyle = viaBrain ? 'rgba(41,128,185,0.35)' : 'rgba(39,174,96,0.35)'
      ctx.lineWidth = 10
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (const p of path.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.stroke()

      ctx.strokeStyle = viaBrain ? '#2980b9' : '#27ae60'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (const p of path.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.stroke()

      // Spine column hint
      ctx.fillStyle = '#bdc3c7'
      ctx.fillRect(spine.x - 10, h * 0.28, 20, h * 0.42)
      drawLabelPill(ctx, 'spinal cord', spine.x, h * 0.3 - 8, { fontSize: Math.max(9, fs - 2) })

      // Brain blob
      ctx.fillStyle = '#f5cba7'
      ctx.beginPath()
      ctx.ellipse(brain.x, brain.y, 28, 22, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#d4a574'
      ctx.lineWidth = 2
      ctx.stroke()

      path.forEach((p, i) => {
        const isEnd = i === path.length - 1
        const isStart = i === 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(14, fs), 0, Math.PI * 2)
        ctx.fillStyle = isStart ? '#e67e22' : isEnd ? '#27ae60' : '#2f6fed'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        drawLabelPill(ctx, labels[i], p.x, p.y - Math.max(26, fs * 2), {
          fontSize: Math.max(10, fs - 1),
        })
      })

      layoutRef.current = { stimulate: { ...receptor, r: 22 } }
      drawHoverHalo(ctx, receptor.x, receptor.y, 28, hoverRef.current)
      drawValueChip(ctx, '', 'tap to stimulate', receptor.x, receptor.y + 32, {
        fontSize: Math.max(9, fs - 2),
      })

      if (s.fired) {
        const segs = path.length - 1
        const t = s.progress * segs
        const i = Math.min(segs - 1, Math.floor(t))
        const f = t - i
        const a = path[i]
        const b = path[i + 1]
        const x = a.x + (b.x - a.x) * f
        const y = a.y + (b.y - a.y) * f

        // Trail
        ctx.strokeStyle = 'rgba(241,196,15,0.5)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        for (let k = 1; k <= i; k++) ctx.lineTo(path[k].x, path[k].y)
        ctx.lineTo(x, y)
        ctx.stroke()

        ctx.save()
        ctx.shadowColor = '#f1c40f'
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.arc(x, y, 11, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.fill()
        ctx.restore()

        drawValueChip(ctx, 'signal', `${Math.round(s.progress * 100)}%`, x, y - 24, {
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })

        if (s.progress >= 1) {
          drawLabelPill(
            ctx,
            viaBrain ? 'Slower path — brain involved' : 'Fast spinal reflex (no brain delay)',
            w / 2,
            h - 36,
            {
              fontSize: fs,
              bg: viaBrain ? 'rgba(41,128,185,0.9)' : 'rgba(39,174,96,0.9)',
              fg: '#fff',
            },
          )
        }
      } else if (hintShown.current) {
        drawHint(ctx, 'tap the orange receptor (or Stimulate)', w / 2, h - 16, w, h)
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
            <ControlHint>Spinal reflexes are faster because they skip the brain on the way out.</ControlHint>
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
