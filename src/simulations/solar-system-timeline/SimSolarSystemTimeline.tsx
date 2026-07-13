import { useCallback, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  eraColor,
  eventAtProgress,
  MAX_PROGRESS,
  MIN_PROGRESS,
  stepTimeline,
  TIMELINE_EVENTS,
  type SolarSystemTimelineState,
  type TimelineEvent,
} from './model'

function drawFormationVignette(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.5
  const cy = h * 0.45
  const sunG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80)
  sunG.addColorStop(0, '#fff9c4')
  sunG.addColorStop(0.4, '#ff9800')
  sunG.addColorStop(1, 'rgba(255,120,0,0)')
  ctx.fillStyle = sunG
  ctx.beginPath()
  ctx.arc(cx, cy, 80, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(200,180,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, 120 + t * 10, 40 + t * 4, 0, 0, Math.PI * 2)
  ctx.stroke()

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * 0.5
    const r = 70 + (i % 3) * 18
    ctx.fillStyle = '#78909c'
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.35, 6 + (i % 2) * 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPlanetsVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w * 0.5
  const cy = h * 0.5
  const sunG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24)
  sunG.addColorStop(0, '#ffeb3b')
  sunG.addColorStop(1, 'rgba(255,200,0,0)')
  ctx.fillStyle = sunG
  ctx.beginPath()
  ctx.arc(cx, cy, 24, 0, Math.PI * 2)
  ctx.fill()

  const planets = [
    { r: 40, size: 4, c: '#9e9e9e' },
    { r: 58, size: 6, c: '#ff7043' },
    { r: 78, size: 7, c: '#42a5f5' },
    { r: 95, size: 5, c: '#ef5350' },
    { r: 115, size: 12, c: '#ffb74d' },
    { r: 138, size: 9, c: '#ffcc80' },
  ]
  planets.forEach((p) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.ellipse(cx, cy, p.r, p.r * 0.35, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = p.c
    ctx.beginPath()
    ctx.arc(cx + p.r, cy, p.size, 0, Math.PI * 2)
    ctx.fill()
  })
}

function drawExplorationVignette(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.35
  const cy = h * 0.55
  ctx.fillStyle = '#78909c'
  ctx.beginPath()
  ctx.arc(cx, cy, 45, 0, Math.PI * 2)
  ctx.fill()

  const lx = cx + 55 + Math.sin(t) * 8
  const ly = cy - 30
  ctx.fillStyle = '#cfd8dc'
  ctx.beginPath()
  ctx.ellipse(lx, ly, 14, 10, -0.4, 0, Math.PI * 2)
  ctx.fill()

  const rocketX = w * 0.65
  const rocketY = h * 0.35 - Math.sin(t * 2) * 6
  ctx.fillStyle = '#eceff1'
  ctx.beginPath()
  ctx.moveTo(rocketX, rocketY - 30)
  ctx.lineTo(rocketX + 12, rocketY + 20)
  ctx.lineTo(rocketX - 12, rocketY + 20)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#ff7043'
  ctx.beginPath()
  ctx.moveTo(rocketX - 8, rocketY + 20)
  ctx.lineTo(rocketX, rocketY + 35 + Math.sin(t * 8) * 4)
  ctx.lineTo(rocketX + 8, rocketY + 20)
  ctx.fill()
}

function drawModernVignette(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.5
  const cy = h * 0.42
  ctx.strokeStyle = 'rgba(100,200,255,0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - 80, cy + 40)
  ctx.lineTo(cx - 40, cy - 20)
  ctx.lineTo(cx + 10, cy - 10)
  ctx.lineTo(cx + 50, cy + 30)
  ctx.stroke()

  for (let i = 0; i < 50; i++) {
    const x = ((i * 4321) % 1000) / 1000 * w
    const y = ((i * 8765) % 1000) / 1000 * h * 0.7
    ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) / 12})`
    ctx.beginPath()
    ctx.arc(x, y, 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#ffd54f'
  ctx.beginPath()
  ctx.arc(cx + 60 + Math.sin(t) * 20, cy - 30, 4, 0, Math.PI * 2)
  ctx.fill()
}

function drawEraVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  event: TimelineEvent,
  animT: number,
) {
  ctx.fillStyle = '#030712'
  ctx.fillRect(0, 0, w, h * 0.62)

  switch (event.era) {
    case 'formation':
      drawFormationVignette(ctx, w, h * 0.62, animT)
      break
    case 'planets':
      drawPlanetsVignette(ctx, w, h * 0.62)
      break
    case 'exploration':
      drawExplorationVignette(ctx, w, h * 0.62, animT)
      break
    case 'modern':
      drawModernVignette(ctx, w, h * 0.62, animT)
      break
  }

  ctx.fillStyle = `${eraColor(event.era)}22`
  ctx.fillRect(0, 0, w, h * 0.62)
}

function drawTimeline(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SolarSystemTimelineState,
  animT: number,
) {
  const event = eventAtProgress(state.progress)

  drawEraVignette(ctx, w, h, event, animT)

  const trackY = h * 0.72
  const pad = 40
  const trackW = w - pad * 2

  ctx.fillStyle = 'rgba(15,23,42,0.92)'
  ctx.fillRect(0, h * 0.62, w, h * 0.38)

  ctx.strokeStyle = 'rgba(148,163,184,0.45)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad, trackY)
  ctx.lineTo(pad + trackW, trackY)
  ctx.stroke()

  TIMELINE_EVENTS.forEach((ev, i) => {
    const x = pad + (i / MAX_PROGRESS) * trackW
    const active = i === Math.round(state.progress)
    ctx.fillStyle = active ? eraColor(ev.era) : 'rgba(100,116,139,0.8)'
    ctx.beginPath()
    ctx.arc(x, trackY, active ? 8 : 5, 0, Math.PI * 2)
    ctx.fill()
    if (active) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.fillStyle = '#64748b'
    ctx.font = '10px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ev.yearLabel, x, trackY + 22)
    ctx.textAlign = 'left'
  })

  const thumbX = pad + (state.progress / MAX_PROGRESS) * trackW
  ctx.fillStyle = '#f1f5f9'
  ctx.beginPath()
  ctx.moveTo(thumbX, trackY - 16)
  ctx.lineTo(thumbX + 8, trackY - 4)
  ctx.lineTo(thumbX - 8, trackY - 4)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#f1f5f9'
  ctx.font = '600 16px Roboto, sans-serif'
  ctx.fillText(event.title, 24, h * 0.62 + 36)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px Roboto, sans-serif'
  const desc = event.description
  ctx.fillText(desc.length > 85 ? `${desc.slice(0, 82)}…` : desc, 24, h * 0.62 + 56)
}

type TimelinePaint = { sim: SolarSystemTimelineState; animT: number }

export function SolarSystemTimelineSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<TimelinePaint>({ sim: createInitialState(), animT: 0 })
  const [running, setRunning] = useState(true)
  const [progress, setProgress] = useState(0)
  const event = eventAtProgress(progress)

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running: true, // always paint; sim.running controls timeline advance
    step: (s, dt) => ({
      animT: s.animT + dt,
      sim: s.sim.running ? stepTimeline(s.sim, dt) : s.sim,
    }),
    draw: (ctx, ww, hh, s) => drawTimeline(ctx, ww, hh, s.sim, s.animT),
    onSync: (s) => {
      setProgress(s.sim.progress)
      setRunning(s.sim.running)
    },
  })

  const reset = useCallback(() => {
    stateRef.current = { sim: createInitialState(), animT: 0 }
    setProgress(0)
    setRunning(true)
  }, [])

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Space Timeline</h3>
          <p className="sim-hint">
            Scrub from the solar system&apos;s birth to modern space missions. Each era shows a
            different vignette.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Timeline</span>
              <span>{event.yearLabel}</span>
            </label>
            <input
              type="range"
              min={MIN_PROGRESS}
              max={MAX_PROGRESS}
              step={0.01}
              value={progress}
              onChange={(e) => {
                const v = Number(e.target.value)
                setProgress(v)
                stateRef.current = {
                  ...stateRef.current,
                  sim: { ...stateRef.current.sim, progress: v, running: false },
                }
              }}
            />
          </div>
          <p className="sim-readout">
            {event.title}
            <br />
            {event.description}
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => {
            const next = !stateRef.current.sim.running
            stateRef.current = {
              ...stateRef.current,
              sim: { ...stateRef.current.sim, running: next },
            }
            setRunning(next)
          }}
          onReset={reset}
        />
      }
    />
  )
}
