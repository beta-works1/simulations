import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  BRAIN_REGIONS,
  brainLabelAnchor,
  drawBrainBase,
  drawBrainRegion,
  hitTestBrainRegion,
  type BrainBox,
  type BrainRegionId,
} from './brainAnatomy'

export function BrainMappingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef<{ selected: BrainRegionId }>({ selected: 'frontal' })
  const boxRef = useRef<BrainBox>({ x: 0, y: 0, w: 1, h: 1 })
  const hoverRef = useRef<BrainRegionId | null>(null)
  const hintShown = useRef(true)
  const pulse = useRef(0)
  const [selected, setSelected] = useState<BrainRegionId>('frontal')
  const [version, setVersion] = useState(0)

  paramsRef.current.selected = selected

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => hitTestBrainRegion(boxRef.current, pt.x, pt.y),
    onHoverChange: (id) => {
      hoverRef.current = id as BrainRegionId | null
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      const rid = id as BrainRegionId
      paramsRef.current.selected = rid
      setSelected(rid)
    },
  })

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    pulse.current += dt
    const sel = paramsRef.current.selected
    const hover = hoverRef.current
    const fs = fontPx(13, w, h)

    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#1a2744')
    bg.addColorStop(1, '#0d1528')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // soft vignette dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.03 + (i % 5) * 0.01})`
      ctx.beginPath()
      ctx.arc(((i * 97) % w), ((i * 53) % h), 1.2, 0, Math.PI * 2)
      ctx.fill()
    }

    const side = Math.min(w * 0.72, h * 0.72)
    const box: BrainBox = {
      x: (w - side) / 2 - w * 0.04,
      y: (h - side) / 2 + h * 0.02,
      w: side * 1.15,
      h: side,
    }
    boxRef.current = box

    drawBrainBase(ctx, box)

    for (const r of BRAIN_REGIONS) {
      const active = sel === r.id
      const isHover = hover === r.id
      drawBrainRegion(ctx, box, r, { active, hover: isHover })
      if (active) {
        const glow = 0.35 + 0.2 * Math.sin(pulse.current * 3.5)
        pathGlow(ctx, box, r.poly, `rgba(255,255,255,${glow * 0.35})`)
      }
      const anchor = brainLabelAnchor(box, r)
      if (active || isHover) {
        drawLabelPill(ctx, r.name.split(' ')[0], anchor.x, anchor.y, {
          fontSize: Math.max(10, fs - 2),
          bg: 'rgba(15,23,42,0.75)',
          fg: '#fff',
        })
      }
    }

    // Profile cue
    drawLabelPill(ctx, 'Left side view', box.x + 8, box.y - 10, {
      align: 'left',
      fontSize: Math.max(10, fs - 2),
      bold: false,
      bg: 'rgba(255,255,255,0.12)',
      fg: 'rgba(255,255,255,0.85)',
    })

    const region = BRAIN_REGIONS.find((r) => r.id === sel)
    if (region) {
      drawValueChip(ctx, '', region.name, 20, 28, { align: 'left', accent: true, fontSize: fs + 1 })
      drawLabelPill(ctx, region.action, 20, 56, {
        align: 'left',
        fontSize: Math.max(11, fs - 1),
        bold: false,
        bg: 'rgba(0,0,0,0.45)',
        fg: 'rgba(255,255,255,0.95)',
      })
    }

    if (hintShown.current) {
      drawHint(ctx, 'click a colored lobe on the brain', w / 2, h - 18, w, h)
    }
  }, [])

  useCanvasLoop(canvasRef, draw, true, version, true)

  return (
    <SimShell
      title="Brain Region Mapping"
      subtitle="Click a lobe on the brain diagram to map structure → function"
      canvasRef={canvasRef}
      running
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        paramsRef.current.selected = 'frontal'
        setSelected('frontal')
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Regions">
            <ControlHint>Use the anatomical brain on the canvas, or pick a region here.</ControlHint>
            <ControlStack>
              {BRAIN_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`sim-shell-btn ${selected === r.id ? 'is-active' : ''}`}
                  onClick={() => {
                    paramsRef.current.selected = r.id
                    setSelected(r.id)
                    hintShown.current = false
                    setVersion((v) => v + 1)
                  }}
                >
                  {r.name}
                </button>
              ))}
            </ControlStack>
          </ControlSection>
        </>
      }
    />
  )
}

function pathGlow(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  poly: { x: number; y: number }[],
  color: string,
) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 16
  ctx.beginPath()
  const first = { x: box.x + poly[0].x * box.w, y: box.y + poly[0].y * box.h }
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < poly.length; i++) {
    ctx.lineTo(box.x + poly[i].x * box.w, box.y + poly[i].y * box.h)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}
