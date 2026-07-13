import { useCallback, useRef, useState } from 'react'
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
  if (!playing) return s
  if (!s.fired) return s
  const speed = s.viaBrain ? 0.28 : 0.55
  const progress = Math.min(1, s.progress + dt * speed)
  return { ...s, progress }
}

export function ReflexArcSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createReflexState(false))
  const [running, setRunning] = useState(false)
  const [viaBrain, setViaBrain] = useState(false)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    stateRef.current.viaBrain = viaBrain
    if (dt > 0) stateRef.current = stepReflex(stateRef.current, dt, running)
    const s = stateRef.current

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#f8f4ef'
    ctx.fillRect(0, 0, w, h)

    const receptor = { x: w * 0.12, y: h * 0.7 }
    const spine = { x: w * 0.45, y: h * 0.45 }
    const brain = { x: w * 0.7, y: h * 0.18 }
    const effector = { x: w * 0.82, y: h * 0.7 }

    const path = viaBrain
      ? [receptor, spine, brain, spine, effector]
      : [receptor, spine, effector]

    // body silhouette hints
    ctx.strokeStyle = '#cbb79d'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(receptor.x, receptor.y)
    for (const p of path.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.stroke()

    const labels = viaBrain
      ? ['Stimulus', 'Spinal cord', 'Brain', 'Spinal cord', 'Effector']
      : ['Stimulus / receptor', 'Spinal cord', 'Effector (muscle)']

    path.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? '#e67e22' : i === path.length - 1 ? '#27ae60' : '#2980b9'
      ctx.fill()
      ctx.fillStyle = '#1a252f'
      ctx.font = '12px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(labels[i], p.x, p.y - 26)
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
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#f1c40f'
      ctx.fill()
      if (s.progress >= 1) {
        ctx.fillStyle = '#27ae60'
        ctx.font = '600 14px Roboto, sans-serif'
        ctx.fillText(viaBrain ? 'Slower — brain involved' : 'Fast reflex — spinal only', w / 2, h - 18)
      }
    } else {
      ctx.fillStyle = '#7f8c8d'
      ctx.font = '13px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Press Play or “Stimulate” to fire the reflex', w / 2, h - 18)
    }
  }, [running, viaBrain])

  useCanvasLoop(canvasRef, draw, true, version)

  const stimulate = () => {
    stateRef.current = { ...createReflexState(viaBrain), fired: true, progress: 0 }
    setRunning(true)
    setVersion((v) => v + 1)
  }

  return (
    <SimShell
      title="Reflex Arc"
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
          <p className="hint">Compare a spinal reflex with a path that involves the brain.</p>
          <label>
            <span>
              <input
                type="checkbox"
                checked={viaBrain}
                onChange={(e) => {
                  setViaBrain(e.target.checked)
                  stateRef.current = createReflexState(e.target.checked)
                  setRunning(false)
                  setVersion((v) => v + 1)
                }}
              />{' '}
              Involve brain
            </span>
          </label>
          <button type="button" className="sim-shell-btn is-primary" onClick={stimulate}>
            Stimulate
          </button>
        </>
      }
    />
  )
}
