import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

const LABELS = ['Cell', 'Nucleus', 'Chromosome', 'DNA double helix', 'Gene segment']

export function DnaZoomSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [zoom, setZoom] = useState(0)
  const [version, setVersion] = useState(0)
  const spin = useRef(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) spin.current += dt
      const fs = fontPx(14, w, h)
      const cx = w / 2
      const cy = h / 2
      const z = zoom

      ctx.fillStyle = '#0d2137'
      ctx.fillRect(0, 0, w, h)

      if (z <= 1) {
        ctx.beginPath()
        ctx.arc(cx, cy, Math.min(w, h) * (0.32 - z * 0.08), 0, Math.PI * 2)
        ctx.fillStyle = '#aed6f1'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx, cy, Math.min(w, h) * (0.12 + z * 0.1), 0, Math.PI * 2)
        ctx.fillStyle = '#5dade2'
        ctx.fill()
      }

      if (z >= 1 && z < 3) {
        const scale = z === 1 ? 0.45 : 1
        for (let i = 0; i < 6; i++) {
          const ang = spin.current * 0.4 + i
          const x = cx + Math.cos(ang) * 42 * scale
          const y = cy + Math.sin(ang * 1.3) * 62 * scale
          ctx.strokeStyle = '#e74c3c'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(x - 8, y - 26)
          ctx.quadraticCurveTo(x + 4, y, x - 8, y + 26)
          ctx.stroke()
        }
      }

      if (z >= 3) {
        const span = Math.min(w * 0.75, 360)
        for (let i = 0; i < 160; i++) {
          const t = i / 20
          const x = cx - span / 2 + (i / 160) * span
          const y1 = cy + Math.sin(t + spin.current) * 42
          const y2 = cy + Math.sin(t + Math.PI + spin.current) * 42
          ctx.strokeStyle = i % 2 ? '#3498db' : '#e74c3c'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x, y1)
          ctx.lineTo(x, y2)
          ctx.stroke()
          if (i % 5 === 0) {
            ctx.fillStyle = '#f1c40f'
            ctx.beginPath()
            ctx.arc(x, y1, 3, 0, Math.PI * 2)
            ctx.arc(x, y2, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        if (z >= 4) {
          ctx.strokeStyle = '#2ecc71'
          ctx.lineWidth = 5
          ctx.strokeRect(cx - 55, cy - 58, 110, 116)
          ctx.fillStyle = '#2ecc71'
          ctx.font = `600 ${fs}px Roboto, sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText('Gene', cx, cy - 70)
        }
      }

      ctx.fillStyle = '#ecf0f1'
      ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(LABELS[zoom], w / 2, 26)
      ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = 'rgba(236,240,241,0.8)'
      ctx.fillText('Cell → Nucleus → Chromosome → DNA → Gene', w / 2, h - 14)
    },
    [running, zoom],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="DNA → Chromosome → Gene"
      subtitle="Zoom from the cell down to a gene segment"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        setZoom(0)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Zoom">
            <ControlHint>Slide to focus from whole cell to a single gene.</ControlHint>
            <ControlSlider
              label="Level"
              value={zoom}
              min={0}
              max={4}
              step={1}
              display={LABELS[zoom]}
              onChange={setZoom}
            />
          </ControlSection>
          <ControlSection title="View">
            <ControlStats>
              <ControlStat label="Focus" value={LABELS[zoom]} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
