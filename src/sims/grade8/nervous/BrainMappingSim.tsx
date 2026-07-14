import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawValueChip } from '../../shared/labels'
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

    // Clean light PhET-like stage
    ctx.fillStyle = '#f5f7fa'
    ctx.fillRect(0, 0, w, h)

    // Center brain with ample margin for exterior labels
    const bw = Math.min(w * 0.58, h * 0.58)
    const bh = bw * 0.95
    const box: BrainBox = {
      x: (w - bw) / 2,
      y: (h - bh) / 2 - 6,
      w: bw,
      h: bh,
    }
    boxRef.current = box

    drawAnatomicalBrain(ctx, box, {
      selected: sel,
      hover,
      fontSize: fs,
      canvasW: w,
      canvasH: h,
    })

    const region = BRAIN_REGIONS.find((r) => r.id === sel)
    if (region) {
      const stripY = h - 40
      const stripH = 30
      const stripX = 14
      const stripW = w - 28
      ctx.fillStyle = '#ffffff'
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

      drawValueChip(ctx, '', region.name, stripX + 10, stripY + stripH / 2, {
        align: 'left',
        accent: true,
        fontSize: Math.max(11, fs - 1),
      })
      ctx.fillStyle = '#34495e'
      ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const actionX = stripX + Math.min(190, w * 0.3)
      ctx.fillText(region.action, actionX, stripY + stripH / 2)
    }

    if (hintShown.current) {
      drawHint(ctx, 'hover · click a lobe to explore', w / 2, 18, w, h)
    }
  }, [])

  useCanvasLoop(canvasRef, draw, true, version, true)

  return (
    <SimShell
      title="Brain Region Mapping"
      subtitle="Click a lobe to map structure → function"
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
            <ControlHint>Click lobes on the brain, or use these buttons.</ControlHint>
            <ControlStack>
              {BRAIN_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`sim-shell-btn${selected === r.id ? ' is-active' : ''}`}
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
