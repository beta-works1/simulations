import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  addSpecies,
  createFoodWebState,
  levelColor,
  stepFoodWeb,
  type FoodWebState,
  type TrophicLevel,
} from './foodWebModel'

function clamp01(n: number) {
  return Math.max(0.08, Math.min(0.92, n))
}

export function FoodWebBuilderSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<FoodWebState>(createFoodWebState())
  const layoutRef = useRef<{ id: string; x: number; y: number; r: number }[]>([])
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [version, setVersion] = useState(0)

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      for (let i = layoutRef.current.length - 1; i >= 0; i--) {
        const n = layoutRef.current[i]
        if (Math.hypot(pt.x - n.x, pt.y - n.y) < n.r + 6) return n.id
      }
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDragStart: (id) => {
      hintShown.current = false
      stateRef.current.selectedId = id
    },
    onDrag: (id, pt, size) => {
      const node = stateRef.current.nodes.find((n) => n.id === id)
      if (node) {
        node.x = clamp01(pt.x / size.w)
        node.y = clamp01(pt.y / size.h)
      }
    },
    onDragEnd: () => {
      /* paint loop reads stateRef — no setVersion */
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      stateRef.current.selectedId = id
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current = stepFoodWeb(stateRef.current, dt)
      const s = stateRef.current
      const hover = hoverRef.current
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
      layoutRef.current = []

      for (const n of s.nodes) {
        const x = n.x * w
        const y = n.y * h
        layoutRef.current.push({ id: n.id, x, y, r: nodeR })

        const isHover = hover === n.id
        const isSel = s.selectedId === n.id
        drawHoverHalo(ctx, x, y, nodeR + 8, isHover || isSel)

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = levelColor(n.level)
        ctx.fill()
        ctx.restore()
        if (isSel) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 3
          ctx.stroke()
        } else if (isHover) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
        ctx.fillStyle = '#fff'
        ctx.font = `600 ${fs}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.name, x, y)
        if (isSel || isHover) {
          drawLabelPill(ctx, n.level, x, y + nodeR + 14, {
            fontSize: Math.max(9, fs - 3),
            bold: false,
          })
        }
      }

      drawLabelPill(ctx, 'energy flows along links →', w / 2, 22, {
        fontSize: Math.max(10, fs - 2),
        bold: false,
        bg: 'rgba(0,0,0,0.35)',
        fg: '#f4d03f',
      })

      if (hintShown.current) {
        drawHint(ctx, 'drag nodes · yellow = energy flow', w / 2, h - 18, w, h, { muted: true })
      }

      const vg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.4,
        Math.min(w, h) * 0.15,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      )
      vg.addColorStop(0, 'rgba(255,255,255,0.04)')
      vg.addColorStop(1, 'rgba(0,0,0,0.18)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, true, version, true)

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
        hintShown.current = true
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
