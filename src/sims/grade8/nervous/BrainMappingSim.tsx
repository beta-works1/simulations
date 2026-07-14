import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  BRAIN_REGIONS,
  drawAnatomicalBrain,
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

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const sel = paramsRef.current.selected
    const hover = hoverRef.current
    const fs = fontPx(13, w, h)

    ctx.fillStyle = '#f4f6f8'
    ctx.fillRect(0, 0, w, h)

    // Leave margin for exterior leader labels so they don't clip
    const side = Math.min(w * 0.62, h * 0.7)
    const box: BrainBox = {
      x: (w - side * 1.05) / 2,
      y: (h - side) / 2 + 8,
      w: side * 1.05,
      h: side,
    }
    boxRef.current = box

    drawAnatomicalBrain(ctx, box, {
      selected: sel,
      hover,
      fontSize: fs,
      showLeaders: true,
    })

    drawLabelPill(ctx, 'Left side view', box.x, box.y - 14, {
      align: 'left',
      fontSize: Math.max(10, fs - 2),
      bold: false,
      bg: 'rgba(255,255,255,0.9)',
    })

    const region = BRAIN_REGIONS.find((r) => r.id === sel)
    if (region) {
      const stripY = h - 44
      const stripH = 32
      const stripX = 16
      const stripW = w - 32
      ctx.fillStyle = 'rgba(255,255,255,0.96)'
      ctx.beginPath()
      ctx.moveTo(stripX + 8, stripY)
      ctx.arcTo(stripX + stripW, stripY, stripX + stripW, stripY + stripH, 8)
      ctx.arcTo(stripX + stripW, stripY + stripH, stripX, stripY + stripH, 8)
      ctx.arcTo(stripX, stripY + stripH, stripX, stripY, 8)
      ctx.arcTo(stripX, stripY, stripX + stripW, stripY, 8)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = region.fillActive
      ctx.lineWidth = 2
      ctx.stroke()
      drawValueChip(ctx, '', region.name, stripX + 12, stripY + stripH / 2, {
        align: 'left',
        accent: true,
        fontSize: fs,
      })
      const actionX = stripX + Math.min(200, w * 0.32)
      drawLabelPill(ctx, region.action, actionX, stripY + stripH / 2, {
        align: 'left',
        fontSize: Math.max(11, fs - 1),
        bold: false,
        bg: 'transparent',
      })
    }

    if (hintShown.current) {
      drawHint(ctx, 'hover a lobe · click to learn its job', w / 2, h - 72, w, h)
    }
  }, [])

  useCanvasLoop(canvasRef, draw, true, version, true)

  return (
    <SimShell
      title="Brain Region Mapping"
      subtitle="Click a lobe on the brain diagram — colors stay inside the outline"
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
            <ControlHint>Click lobes on the canvas, or use these buttons.</ControlHint>
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
