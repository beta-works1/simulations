import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  createInitialState,
  galaxyById,
  GALAXIES,
  stepGalaxyTypes,
  type GalaxyType,
  type GalaxyTypesState,
} from './model'

function drawSpiralGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rotDeg: number,
  scale: number,
) {
  const rot = (rotDeg * Math.PI) / 180
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 22 * scale)
  core.addColorStop(0, '#fff8e1')
  core.addColorStop(0.5, '#ffd54f')
  core.addColorStop(1, 'rgba(255,180,50,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(0, 0, 22 * scale, 0, Math.PI * 2)
  ctx.fill()

  for (let arm = 0; arm < 2; arm++) {
    ctx.strokeStyle = `rgba(180,200,255,${0.35 + arm * 0.1})`
    ctx.lineWidth = 14 * scale
    ctx.beginPath()
    for (let t = 0; t <= 1; t += 0.02) {
      const angle = t * Math.PI * 3 + arm * Math.PI
      const r = (8 + t * 55) * scale
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r * 0.55
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  for (let i = 0; i < 120; i++) {
    const angle = ((i * 137.5) / 180) * Math.PI
    const r = ((i % 20) / 20) * 60 * scale + 5
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r * 0.55
    ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) / 10})`
    ctx.beginPath()
    ctx.arc(x, y, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawEllipticalGalaxy(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * scale)
  g.addColorStop(0, '#ffe082')
  g.addColorStop(0.4, '#bcaaa4')
  g.addColorStop(0.75, '#6d4c41')
  g.addColorStop(1, 'rgba(40,30,25,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(cx, cy, 55 * scale, 35 * scale, 0.3, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < 80; i++) {
    const t = i / 80
    const angle = t * Math.PI * 2
    const r = 15 + (i % 12) * 3
    const x = cx + Math.cos(angle) * r * scale
    const y = cy + Math.sin(angle) * r * 0.65 * scale
    ctx.fillStyle = `rgba(255,240,220,${0.25 + (i % 4) / 8})`
    ctx.beginPath()
    ctx.arc(x, y, 0.7, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawIrregularGalaxy(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const blobs = [
    { dx: -20, dy: -10, r: 28, c: '#7986cb' },
    { dx: 25, dy: 5, r: 22, c: '#ef5350' },
    { dx: -5, dy: 22, r: 18, c: '#ffb74d' },
    { dx: 15, dy: -25, r: 15, c: '#81c784' },
  ]
  blobs.forEach((b) => {
    const g = ctx.createRadialGradient(cx + b.dx * scale, cy + b.dy * scale, 0, cx + b.dx * scale, cy + b.dy * scale, b.r * scale)
    g.addColorStop(0, b.c)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx + b.dx * scale, cy + b.dy * scale, b.r * scale, 0, Math.PI * 2)
    ctx.fill()
  })
  for (let i = 0; i < 60; i++) {
    const x = cx + (((i * 4321) % 100) / 100 - 0.5) * 90 * scale
    const y = cy + (((i * 8765) % 100) / 100 - 0.5) * 60 * scale
    ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) / 10})`
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawGalaxyTypes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: GalaxyTypesState,
) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 100; i++) {
    const x = ((i * 6151) % 1000) / 1000 * w
    const y = ((i * 3571) % 1000) / 1000 * h
    ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 7) / 20})`
    ctx.beginPath()
    ctx.arc(x, y, 0.5 + (i % 3) * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  const compareAll = w > 520
  if (compareAll) {
    const third = w / 3
    drawSpiralGalaxy(ctx, third * 0.5, h * 0.45, state.rotation, 0.9)
    drawEllipticalGalaxy(ctx, third * 1.5, h * 0.45, 0.9)
    drawIrregularGalaxy(ctx, third * 2.5, h * 0.45, 0.9)

    ctx.fillStyle = '#64748b'
    ctx.font = '600 11px Roboto, sans-serif'
    ctx.textAlign = 'center'
    GALAXIES.forEach((g, i) => {
      ctx.fillStyle = g.id === state.selected ? '#38bdf8' : '#64748b'
      ctx.fillText(g.label, third * (i + 0.5), h * 0.82)
    })
    ctx.textAlign = 'left'

    ctx.strokeStyle =
      state.selected === 'spiral'
        ? 'rgba(56,189,248,0.5)'
        : state.selected === 'elliptical'
          ? 'rgba(56,189,248,0.5)'
          : 'rgba(56,189,248,0.5)'
    const hi = GALAXIES.findIndex((g) => g.id === state.selected)
    ctx.strokeRect(third * hi + 8, 12, third - 16, h - 24)
  } else {
    const cx = w * 0.5
    const cy = h * 0.45
    if (state.selected === 'spiral') drawSpiralGalaxy(ctx, cx, cy, state.rotation, 1.1)
    else if (state.selected === 'elliptical') drawEllipticalGalaxy(ctx, cx, cy, 1.1)
    else drawIrregularGalaxy(ctx, cx, cy, 1.1)
  }

  const info = galaxyById(state.selected)
  ctx.fillStyle = 'rgba(15,23,42,0.88)'
  ctx.fillRect(16, h - 64, w - 32, 48)
  ctx.fillStyle = '#f1f5f9'
  ctx.font = '600 14px Roboto, sans-serif'
  ctx.fillText(info.label, 28, h - 38)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px Roboto, sans-serif'
  ctx.fillText(info.description, 28, h - 20)
}

export function GalaxyTypesSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<GalaxyTypesState>(createInitialState)
  const info = galaxyById(state.selected)

  useAnimationLoop(state.running, (dt) => {
    setState((s) => stepGalaxyTypes(s, dt))
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawGalaxyTypes(ctx, w, h, state)
  }, [w, h, state])

  const reset = useCallback(() => setState(createInitialState()), [])

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Galaxy Types</h3>
          <p className="sim-hint">
            Compare spiral, elliptical, and irregular galaxies. Spiral arms rotate slowly as stars
            orbit the core.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Galaxy type</span>
            </label>
            <select
              className="sim-select"
              value={state.selected}
              onChange={(e) =>
                setState((s) => ({ ...s, selected: e.target.value as GalaxyType }))
              }
            >
              {GALAXIES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <p className="sim-readout">{info.description}</p>
        </>
      }
      toolbar={
        <SimTransport
          running={state.running}
          onToggle={() => setState((s) => ({ ...s, running: !s.running }))}
          onReset={reset}
        />
      }
    />
  )
}
