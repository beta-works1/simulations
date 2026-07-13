import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearScene, fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

const LABELS = ['Cell', 'Nucleus', 'Chromosome', 'DNA double helix', 'Gene segment']

type Layout = {
  track: { x: number; y: number; w: number; h: number }
  handle: { x: number; y: number; r: number }
}

export function DnaZoomSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef({ zoom: 0 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const spin = useRef(0)
  const [running, setRunning] = useState(true)
  const [zoom, setZoom] = useState(0)
  const [version, setVersion] = useState(0)

  paramsRef.current.zoom = zoom

  useEffect(() => {
    const id = window.setInterval(() => {
      setZoom(paramsRef.current.zoom)
    }, 120)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      hintShown.current = false
      const delta = e.deltaY > 0 ? 1 : -1
      paramsRef.current.zoom = clamp(Math.round(paramsRef.current.zoom + delta), 0, 4)
      setZoom(paramsRef.current.zoom)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      const h = L.handle
      if (Math.hypot(pt.x - h.x, pt.y - h.y) < h.r + 10) return 'handle'
      const t = L.track
      if (pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h) return 'track'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      const L = layoutRef.current
      if (!L || (id !== 'handle' && id !== 'track')) return
      hintShown.current = false
      const t = clamp((pt.x - L.track.x) / L.track.w, 0, 1)
      paramsRef.current.zoom = Math.round(t * 4)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) spin.current += dt
      const z = paramsRef.current.zoom
      const hover = hoverRef.current
      const fs = fontPx(14, w, h)
      const cx = w / 2
      const cy = h / 2

      clearScene(ctx, w, h)

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
          drawLabelPill(ctx, 'Gene', cx, cy - 70, { fontSize: fs, bg: 'rgba(46,204,113,0.25)', fg: '#2ecc71' })
        }
      }

      drawLabelPill(ctx, LABELS[z], w / 2, 26, { fontSize: fs + 1, bg: 'rgba(255,255,255,0.12)', fg: '#ecf0f1' })

      const trackY = h - 48
      const trackX = w * 0.12
      const trackW = w * 0.76
      const trackH = 10
      layoutRef.current = {
        track: { x: trackX, y: trackY - 8, w: trackW, h: 24 },
        handle: { x: trackX + (z / 4) * trackW, y: trackY, r: 12 },
      }

      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(trackX, trackY - trackH / 2, trackW, trackH)
      ctx.fillStyle = 'rgba(41,128,185,0.6)'
      ctx.fillRect(trackX, trackY - trackH / 2, (z / 4) * trackW, trackH)

      const handleHover = hover === 'handle' || hover === 'track'
      drawHoverHalo(ctx, layoutRef.current.handle.x, trackY, 18, handleHover)
      ctx.beginPath()
      ctx.arc(layoutRef.current.handle.x, trackY, 12, 0, Math.PI * 2)
      ctx.fillStyle = handleHover ? '#5dade2' : '#3498db'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      for (let i = 0; i < LABELS.length; i++) {
        const lx = trackX + (i / 4) * trackW
        drawValueChip(ctx, '', LABELS[i].split(' ')[0], lx, trackY - 28, {
          fontSize: Math.max(9, fs - 3),
          accent: i === z,
        })
      }

      if (hintShown.current) {
        drawHint(ctx, 'drag slider · scroll to zoom', w / 2, h - 14, w, h, { muted: true })
      }
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
        paramsRef.current.zoom = 0
        setZoom(0)
        hintShown.current = true
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
              onChange={(v) => {
                paramsRef.current.zoom = v
                setZoom(v)
              }}
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
