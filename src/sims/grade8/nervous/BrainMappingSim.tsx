import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { clearThemedScene, fontPx, withShadow } from '../../shared/drawHelpers'
import { drawGlow, SCENE } from '../../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

const REGIONS = [
  { id: 'frontal', name: 'Frontal lobe', action: 'Planning, decisions, voluntary movement', x: 0.32, y: 0.42, r: 0.12 },
  { id: 'parietal', name: 'Parietal lobe', action: 'Touch and spatial awareness', x: 0.55, y: 0.36, r: 0.1 },
  { id: 'temporal', name: 'Temporal lobe', action: 'Hearing, language, memory', x: 0.48, y: 0.58, r: 0.1 },
  { id: 'occipital', name: 'Occipital lobe', action: 'Vision processing', x: 0.72, y: 0.45, r: 0.09 },
  { id: 'cerebellum', name: 'Cerebellum', action: 'Balance and coordination', x: 0.68, y: 0.7, r: 0.08 },
  { id: 'brainstem', name: 'Brain stem', action: 'Breathing and heart rate', x: 0.58, y: 0.78, r: 0.06 },
] as const

type RegionLayout = { id: string; x: number; y: number; r: number }

type Layout = { regions: RegionLayout[] }

export function BrainMappingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef({ selected: 'frontal' })
  const layoutRef = useRef<Layout>({ regions: [] })
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const pulse = useRef(0)
  const [selected, setSelected] = useState<string>('frontal')
  const [version, setVersion] = useState(0)

  paramsRef.current.selected = selected

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      for (let i = layoutRef.current.regions.length - 1; i >= 0; i--) {
        const r = layoutRef.current.regions[i]
        if (Math.hypot(pt.x - r.x, pt.y - r.y) <= r.r) return r.id
      }
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      paramsRef.current.selected = id
      setSelected(id)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      pulse.current += dt
      const sel = paramsRef.current.selected
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)
      const minDim = Math.min(w, h)

      clearThemedScene(ctx, w, h, 'nervous')

      withShadow(ctx, () => {
        ctx.beginPath()
        ctx.ellipse(w * 0.5, h * 0.5, w * 0.34, h * 0.38, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#f3e6d4'
        ctx.fill()
        ctx.strokeStyle = '#c9b59a'
        ctx.lineWidth = 3
        ctx.stroke()
      })

      layoutRef.current.regions = []

      for (const r of REGIONS) {
        const px = r.x * w
        const py = r.y * h
        const pr = r.r * minDim
        layoutRef.current.regions.push({ id: r.id, x: px, y: py, r: pr })

        const active = sel === r.id
        const isHover = hover === r.id
        const glow = active ? 0.3 + 0.15 * Math.sin(pulse.current * 4) : 0

        drawHoverHalo(ctx, px, py, pr + 6, isHover && !active)
        if (active) drawGlow(ctx, px, py, pr * 1.65, SCENE.nervous.glow, 0.42 + glow)

        ctx.beginPath()
        ctx.arc(px, py, pr * (active ? 1.08 : isHover ? 1.04 : 1), 0, Math.PI * 2)
        ctx.fillStyle = active
          ? `rgba(47, 111, 237, ${0.78 + glow})`
          : isHover
            ? 'rgba(133, 193, 233, 0.75)'
            : 'rgba(133, 193, 233, 0.55)'
        ctx.fill()
        if (active || isHover) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = active ? 2.5 : 2
          ctx.stroke()
        }
        ctx.fillStyle = '#1a252f'
        ctx.font = `600 ${Math.max(10, fs - 2)}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(r.name.split(' ')[0], px, py)
      }

      const region = REGIONS.find((r) => r.id === sel)
      if (region) {
        drawLabelPill(ctx, region.name, 24 + 80, 32, { align: 'left', fontSize: fs + 1 })
        drawLabelPill(ctx, region.action, 24 + 120, 56, {
          align: 'left',
          fontSize: Math.max(11, fs - 1),
          bold: false,
          bg: 'rgba(0,0,0,0.45)',
          fg: 'rgba(255,255,255,0.95)',
        })
      }

      if (hintShown.current) {
        drawHint(ctx, 'hover regions · click to select', w / 2, h - 18, w, h, { muted: true })
      }
    },
    [selected],
  )

  useCanvasLoop(canvasRef, draw, true, version, true)

  return (
    <SimShell
      title="Brain Region Mapping"
      subtitle="Click a region to map structure → function"
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
            <ControlHint>Select a lobe or structure to learn what it controls.</ControlHint>
            <ControlStack>
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`sim-shell-btn ${selected === r.id ? 'is-active' : ''}`}
                  onClick={() => {
                    paramsRef.current.selected = r.id
                    setSelected(r.id)
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
