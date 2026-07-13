import { useCallback, useEffect, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { drawBadge, fontPx } from '../../shared/drawHelpers'
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

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current = stepFoodWeb(stateRef.current, dt)
      const s = stateRef.current
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#102a3c')
      bg.addColorStop(1, '#1a3d2f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      for (const link of s.links) {
        const a = s.nodes.find((n) => n.id === link.from)
        const b = s.nodes.find((n) => n.id === link.to)
        if (!a || !b) continue
        const x1 = a.x * w
        const y1 = a.y * h
        const x2 = b.x * w
        const y2 = b.y * h
        ctx.strokeStyle = 'rgba(236,240,241,0.35)'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        const p = (s.energyPulse % 1.6) / 1.6
        const px = x1 + (x2 - x1) * p
        const py = y1 + (y2 - y1) * p
        ctx.beginPath()
        ctx.arc(px, py, 5.5, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.fill()
      }

      const nodeR = Math.max(22, Math.min(34, Math.min(w, h) * 0.055))
      for (const n of s.nodes) {
        const x = n.x * w
        const y = n.y * h
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = levelColor(n.level)
        ctx.fill()
        ctx.restore()
        if (s.selectedId === n.id) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 3
          ctx.stroke()
        }
        ctx.fillStyle = '#fff'
        ctx.font = `600 ${fs}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.name, x, y)
      }

      drawBadge(ctx, 'Drag nodes · yellow = energy', 12, h - 18, {
        font: `${fontPx(11, w, h, 10, 13)}px Roboto, sans-serif`,
      })
    },
    [running],
  )

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
      const nodeR = 34
      for (let i = s.nodes.length - 1; i >= 0; i--) {
        const n = s.nodes[i]
        const dx = (n.x - x) * canvas.clientWidth
        const dy = (n.y - y) * canvas.clientHeight
        if (dx * dx + dy * dy < nodeR * nodeR) return n.id
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
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [])

  const add = (level: TrophicLevel, name: string) => {
    stateRef.current = addSpecies(stateRef.current, level, name)
    setVersion((v) => v + 1)
  }

  return (
    <SimShell
      title="Food Chain / Food Web"
      subtitle="Build links and watch energy move between species"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createFoodWebState()
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Add species">
            <ControlHint>Producers make energy; consumers eat; decomposers recycle.</ControlHint>
            <ControlStack>
              <button type="button" className="sim-shell-btn" onClick={() => add('producer', 'Algae')}>
                + Producer
              </button>
              <button type="button" className="sim-shell-btn" onClick={() => add('herbivore', 'Deer')}>
                + Herbivore
              </button>
              <button type="button" className="sim-shell-btn" onClick={() => add('carnivore', 'Hawk')}>
                + Carnivore
              </button>
              <button
                type="button"
                className="sim-shell-btn"
                onClick={() => add('decomposer', 'Bacteria')}
              >
                + Decomposer
              </button>
            </ControlStack>
          </ControlSection>
        </>
      }
    />
  )
}
