import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

const REGIONS = [
  { id: 'frontal', name: 'Frontal lobe', action: 'Planning, decision-making, voluntary movement', x: 0.32, y: 0.42, r: 0.12 },
  { id: 'parietal', name: 'Parietal lobe', action: 'Touch, spatial awareness', x: 0.55, y: 0.36, r: 0.1 },
  { id: 'temporal', name: 'Temporal lobe', action: 'Hearing, language, memory', x: 0.48, y: 0.58, r: 0.1 },
  { id: 'occipital', name: 'Occipital lobe', action: 'Vision processing', x: 0.72, y: 0.45, r: 0.09 },
  { id: 'cerebellum', name: 'Cerebellum', action: 'Balance and coordination', x: 0.68, y: 0.7, r: 0.08 },
  { id: 'brainstem', name: 'Brain stem', action: 'Breathing, heart rate', x: 0.58, y: 0.78, r: 0.06 },
] as const

export function BrainMappingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<string | null>('frontal')
  const [version, setVersion] = useState(0)
  const pulse = useRef(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    pulse.current += dt
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#1b2a3a'
    ctx.fillRect(0, 0, w, h)

    // skull outline
    ctx.beginPath()
    ctx.ellipse(w * 0.5, h * 0.48, w * 0.32, h * 0.36, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#f5e6d3'
    ctx.fill()
    ctx.strokeStyle = '#c9b59a'
    ctx.lineWidth = 3
    ctx.stroke()

    for (const r of REGIONS) {
      const active = selected === r.id
      const glow = active ? 0.35 + 0.15 * Math.sin(pulse.current * 4) : 0
      ctx.beginPath()
      ctx.arc(r.x * w, r.y * h, r.r * Math.min(w, h) * (active ? 1.08 : 1), 0, Math.PI * 2)
      ctx.fillStyle = active ? `rgba(52, 152, 219, ${0.75 + glow})` : 'rgba(133, 193, 233, 0.55)'
      ctx.fill()
      ctx.strokeStyle = active ? '#fff' : 'transparent'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#1a252f'
      ctx.font = '600 11px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(r.name.split(' ')[0], r.x * w, r.y * h + 4)
    }

    const region = REGIONS.find((r) => r.id === selected)
    if (region) {
      ctx.fillStyle = '#ecf0f1'
      ctx.font = '600 15px Roboto, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(region.name, 16, 28)
      ctx.font = '13px Roboto, sans-serif'
      ctx.fillText(region.action, 16, 50)
    }
  }, [selected])

  useCanvasLoop(canvasRef, draw, true, version)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      for (const r of [...REGIONS].reverse()) {
        const dx = x - r.x
        const dy = y - r.y
        const rr = r.r
        if (dx * dx + dy * dy <= rr * rr) {
          setSelected(r.id)
          setVersion((v) => v + 1)
          return
        }
      }
    }
    canvas.addEventListener('pointerdown', onDown)
    return () => canvas.removeEventListener('pointerdown', onDown)
  }, [])

  return (
    <SimShell
      title="Brain Regions → Actions"
      canvasRef={canvasRef}
      running
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        setSelected('frontal')
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Click a brain region to see what it helps control.</p>
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`sim-shell-btn ${selected === r.id ? 'is-primary' : ''}`}
              onClick={() => {
                setSelected(r.id)
                setVersion((v) => v + 1)
              }}
            >
              {r.name}
            </button>
          ))}
        </>
      }
    />
  )
}
