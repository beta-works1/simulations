import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export function DnaZoomSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [zoom, setZoom] = useState(0) // 0 cell → 1 nucleus → 2 chromosome → 3 dna → 4 gene
  const [version, setVersion] = useState(0)
  const spin = useRef(0)

  const labels = ['Cell', 'Nucleus', 'Chromosome', 'DNA double helix', 'Gene segment']

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    if (dt > 0 && running) spin.current += dt
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0d2137'
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const z = zoom

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
      const scale = z === 1 ? 0.4 : 1
      for (let i = 0; i < 6; i++) {
        const ang = spin.current * 0.4 + i
        const x = cx + Math.cos(ang) * 40 * scale
        const y = cy + Math.sin(ang * 1.3) * 60 * scale
        ctx.strokeStyle = '#e74c3c'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(x - 8, y - 25)
        ctx.quadraticCurveTo(x + 4, y, x - 8, y + 25)
        ctx.stroke()
      }
    }

    if (z >= 3) {
      const turns = 8
      for (let i = 0; i < turns * 20; i++) {
        const t = i / 20
        const x = cx - 160 + t * 40
        const y1 = cy + Math.sin(t + spin.current) * 40
        const y2 = cy + Math.sin(t + Math.PI + spin.current) * 40
        ctx.strokeStyle = i % 2 ? '#3498db' : '#e74c3c'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
        if (i % 4 === 0) {
          ctx.beginPath()
          ctx.arc(x, y1, 3, 0, Math.PI * 2)
          ctx.arc(x, y2, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#f1c40f'
          ctx.fill()
        }
      }
      if (z >= 4) {
        ctx.strokeStyle = '#2ecc71'
        ctx.lineWidth = 6
        ctx.strokeRect(cx - 50, cy - 55, 100, 110)
        ctx.fillStyle = '#2ecc71'
        ctx.font = '600 14px Roboto, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Gene', cx, cy - 65)
      }
    }

    ctx.fillStyle = '#ecf0f1'
    ctx.font = '600 16px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(labels[zoom], w / 2, 28)
    ctx.font = '12px Roboto, sans-serif'
    ctx.fillText('Cell → Nucleus → Chromosome → DNA → Gene', w / 2, h - 14)
  }, [running, zoom])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="DNA → Chromosome → Gene"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        setZoom(0)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Zoom from the whole cell down to a single gene.</p>
          <label>
            Zoom level
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <div className="stat">
            <span>View</span>
            <strong>{labels[zoom]}</strong>
          </div>
        </>
      }
    />
  )
}
