import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack, ControlToggle } from '../../shared/Controls'
import { drawBadge, fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

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
  const speed = s.viaBrain ? 0.3 : 0.58
  return { ...s, progress: Math.min(1, s.progress + dt * speed) }
}

export function ReflexArcSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createReflexState(false))
  const [running, setRunning] = useState(false)
  const [viaBrain, setViaBrain] = useState(false)
  const [version, setVersion] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      stateRef.current.viaBrain = viaBrain
      if (dt > 0) stateRef.current = stepReflex(stateRef.current, dt, running)
      const s = stateRef.current
      const fs = fontPx(12, w, h)

      ctx.fillStyle = '#f4f1ec'
      ctx.fillRect(0, 0, w, h)

      const receptor = { x: w * 0.12, y: h * 0.72 }
      const spine = { x: w * 0.42, y: h * 0.42 }
      const brain = { x: w * 0.68, y: h * 0.18 }
      const effector = { x: w * 0.84, y: h * 0.72 }
      const path = viaBrain ? [receptor, spine, brain, spine, effector] : [receptor, spine, effector]
      const labels = viaBrain
        ? ['Receptor', 'Spinal cord', 'Brain', 'Spinal cord', 'Effector']
        : ['Receptor', 'Spinal cord', 'Effector']

      ctx.strokeStyle = '#d2c2ad'
      ctx.lineWidth = 7
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (const p of path.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.stroke()

      path.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(14, fs), 0, Math.PI * 2)
        ctx.fillStyle = i === 0 ? '#e67e22' : i === path.length - 1 ? '#27ae60' : '#2f6fed'
        ctx.fill()
        ctx.fillStyle = '#1a252f'
        ctx.font = `600 ${Math.max(10, fs - 1)}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(labels[i], p.x, p.y - Math.max(22, fs * 1.8))
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
        ctx.save()
        ctx.shadowColor = '#f1c40f'
        ctx.shadowBlur = 14
        ctx.beginPath()
        ctx.arc(x, y, 9, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.fill()
        ctx.restore()
        if (s.progress >= 1) {
          drawBadge(
            ctx,
            viaBrain ? 'Slower path — brain involved' : 'Fast spinal reflex',
            w / 2 - 90,
            h - 20,
            { bg: viaBrain ? 'rgba(41,128,185,0.9)' : 'rgba(39,174,96,0.9)', font: `${fs}px Roboto, sans-serif` },
          )
        }
      } else {
        drawBadge(ctx, 'Press Stimulate or Play to fire', w / 2 - 100, h - 20, {
          font: `${fs}px Roboto, sans-serif`,
        })
      }
    },
    [running, viaBrain],
  )

  useCanvasLoop(canvasRef, draw, true, version)

  const stimulate = () => {
    stateRef.current = { ...createReflexState(viaBrain), fired: true, progress: 0 }
    setRunning(true)
    setVersion((v) => v + 1)
  }

  return (
    <SimShell
      title="Reflex Arc"
      subtitle="Stimulus → spinal cord → response (optional brain route)"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => {
        if (!stateRef.current.fired) stimulate()
        else setRunning((r) => !r)
      }}
      onReset={() => {
        stateRef.current = createReflexState(viaBrain)
        setRunning(false)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Path">
            <ControlHint>Turn on brain involvement to make the response take longer.</ControlHint>
            <ControlToggle
              label="Involve brain"
              checked={viaBrain}
              onChange={(checked) => {
                setViaBrain(checked)
                stateRef.current = createReflexState(checked)
                setRunning(false)
                setVersion((v) => v + 1)
              }}
            />
            <ControlStack>
              <button type="button" className="sim-shell-btn is-primary" onClick={stimulate}>
                Stimulate
              </button>
            </ControlStack>
          </ControlSection>
        </>
      }
    />
  )
}
