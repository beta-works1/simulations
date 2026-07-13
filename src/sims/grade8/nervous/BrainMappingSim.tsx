import { useCallback, useEffect, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlStack } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

const REGIONS = [
  { id: 'frontal', name: 'Frontal lobe', action: 'Planning, decisions, voluntary movement', x: 0.32, y: 0.42, r: 0.12 },
  { id: 'parietal', name: 'Parietal lobe', action: 'Touch and spatial awareness', x: 0.55, y: 0.36, r: 0.1 },
  { id: 'temporal', name: 'Temporal lobe', action: 'Hearing, language, memory', x: 0.48, y: 0.58, r: 0.1 },
  { id: 'occipital', name: 'Occipital lobe', action: 'Vision processing', x: 0.72, y: 0.45, r: 0.09 },
  { id: 'cerebellum', name: 'Cerebellum', action: 'Balance and coordination', x: 0.68, y: 0.7, r: 0.08 },
  { id: 'brainstem', name: 'Brain stem', action: 'Breathing and heart rate', x: 0.58, y: 0.78, r: 0.06 },
] as const

export function BrainMappingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<string>('frontal')
  const [version, setVersion] = useState(0)
  const pulse = useRef(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      pulse.current += dt
      const fs = fontPx(13, w, h)
      ctx.fillStyle = '#1b2a3a'
      ctx.fillRect(0, 0, w, h)

      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.5, w * 0.34, h * 0.38, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#f3e6d4'
      ctx.fill()
      ctx.strokeStyle = '#c9b59a'
      ctx.lineWidth = 3
      ctx.stroke()

      for (const r of REGIONS) {
        const active = selected === r.id
        const glow = active ? 0.3 + 0.15 * Math.sin(pulse.current * 4) : 0
        ctx.beginPath()
        ctx.arc(r.x * w, r.y * h, r.r * Math.min(w, h) * (active ? 1.08 : 1), 0, Math.PI * 2)
        ctx.fillStyle = active ? `rgba(47, 111, 237, ${0.78 + glow})` : 'rgba(133, 193, 233, 0.55)'
        ctx.fill()
        if (active) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2.5
          ctx.stroke()
        }
        ctx.fillStyle = '#1a252f'
        ctx.font = `600 ${Math.max(10, fs - 2)}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(r.name.split(' ')[0], r.x * w, r.y * h)
      }

      const region = REGIONS.find((r) => r.id === selected)
      if (region) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        const boxW = Math.min(w - 24, 360)
        ctx.fillRect(12, 12, boxW, 52)
        ctx.fillStyle = '#fff'
        ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
        ctx.textAlign = 'left'
        ctx.fillText(region.name, 24, 32)
        ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillText(region.action, 24, 52)
      }
    },
    [selected],
  )

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
        if (dx * dx + dy * dy <= r.r * r.r) {
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
      title="Brain Region Mapping"
      subtitle="Click a region to map structure → function"
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
          <ControlSection title="Regions">
            <ControlHint>Select a lobe or structure to learn what it controls.</ControlHint>
            <ControlStack>
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`sim-shell-btn ${selected === r.id ? 'is-active' : ''}`}
                  onClick={() => {
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
