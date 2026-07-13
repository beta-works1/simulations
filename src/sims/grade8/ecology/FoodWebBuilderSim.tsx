import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  addSpecies,
  createFoodWebState,
  levelColor,
  moveNode,
  stepFoodWeb,
  type FoodWebState,
  type TrophicLevel,
} from './foodWebModel'

export function FoodWebBuilderSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<FoodWebState>(createFoodWebState())
  const dragId = useRef<string | null>(null)
  const [running, setRunning] = useState(true)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    if (dt > 0 && running) stateRef.current = stepFoodWeb(stateRef.current, dt)
    const s = stateRef.current
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#102a3c'
    ctx.fillRect(0, 0, w, h)

    for (const link of s.links) {
      const a = s.nodes.find((n) => n.id === link.from)
      const b = s.nodes.find((n) => n.id === link.to)
      if (!a || !b) continue
      const x1 = a.x * w
      const y1 = a.y * h
      const x2 = b.x * w
      const y2 = b.y * h
      ctx.strokeStyle = '#7f8c8d'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      const p = (s.energyPulse % 1.5) / 1.5
      const px = x1 + (x2 - x1) * p
      const py = y1 + (y2 - y1) * p
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#f1c40f'
      ctx.fill()
    }

    for (const n of s.nodes) {
      const x = n.x * w
      const y = n.y * h
      ctx.beginPath()
      ctx.arc(x, y, 28, 0, Math.PI * 2)
      ctx.fillStyle = levelColor(n.level)
      ctx.fill()
      if (s.selectedId === n.id) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      ctx.fillStyle = '#fff'
      ctx.font = '600 12px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(n.name, x, y + 4)
    }

    ctx.fillStyle = '#aeb6bf'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Drag species · yellow dots = energy flow', 12, h - 12)
  }, [running])

  useCanvasLoop(canvasRef, draw, true, version)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
    }

    const hit = (x: number, y: number) => {
      const s = stateRef.current
      for (let i = s.nodes.length - 1; i >= 0; i--) {
        const n = s.nodes[i]
        const dx = (n.x - x) * canvas.clientWidth
        const dy = (n.y - y) * canvas.clientHeight
        if (dx * dx + dy * dy < 32 * 32) return n.id
      }
      return null
    }

    const down = (e: PointerEvent) => {
      const p = pos(e)
      const id = hit(p.x, p.y)
      dragId.current = id
      stateRef.current = { ...stateRef.current, selectedId: id }
      setVersion((v) => v + 1)
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragId.current) return
      const p = pos(e)
      stateRef.current = moveNode(stateRef.current, dragId.current, p.x, p.y)
      setVersion((v) => v + 1)
    }
    const up = () => {
      dragId.current = null
    }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
    }
  }, [])

  const add = (level: TrophicLevel, name: string) => {
    stateRef.current = addSpecies(stateRef.current, level, name)
    setVersion((v) => v + 1)
  }

  return (
    <SimShell
      title="Food Chain / Food Web"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createFoodWebState()
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Build a web by adding species. Energy flows from prey → predator.</p>
          <button type="button" className="sim-shell-btn" onClick={() => add('producer', 'Algae')}>
            + Producer
          </button>
          <button type="button" className="sim-shell-btn" onClick={() => add('herbivore', 'Deer')}>
            + Herbivore
          </button>
          <button type="button" className="sim-shell-btn" onClick={() => add('carnivore', 'Hawk')}>
            + Carnivore
          </button>
          <button type="button" className="sim-shell-btn" onClick={() => add('decomposer', 'Bacteria')}>
            + Decomposer
          </button>
        </>
      }
    />
  )
}
