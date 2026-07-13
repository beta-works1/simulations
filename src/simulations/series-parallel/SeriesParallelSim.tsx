import { useCallback, useEffect, useRef, useState } from 'react'
import { drawGlow, fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  advanceParticles,
  computeCircuit,
  DEFAULT_SERIES_PARALLEL_STATE,
  parallelLoops,
  pointOnLoop,
  seriesLoop,
  spawnParticles,
  type CircuitMode,
  type Particle,
  type Point,
  type SeriesParallelState,
} from './model'

function wirePath(ctx: CanvasRenderingContext2D, points: Point[], closed = true) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  if (closed) ctx.closePath()
}

function drawWire(ctx: CanvasRenderingContext2D, points: Point[], energized = false, closed = true) {
  const color = energized ? SCENE.electric.accent : '#64748b'
  const width = 3
  if (energized) {
    strokeWithGlow(ctx, () => wirePath(ctx, points, closed), color, width, SCENE.electric.glow)
  } else {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    wirePath(ctx, points, closed)
    ctx.stroke()
  }
}

function drawBattery(ctx: CanvasRenderingContext2D, x: number, y: number, voltage: number) {
  ctx.strokeStyle = '#f8fafc'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(x - 14, y - 18)
  ctx.lineTo(x - 14, y + 18)
  ctx.moveTo(x + 14, y - 10)
  ctx.lineTo(x + 14, y + 10)
  ctx.stroke()
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${voltage} V`, x, y + 36)
}

function drawBulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brightness: number,
  label: string,
) {
  const glow = brightness
  if (glow > 0.05) {
    drawGlow(ctx, x, y, 24 + glow * 20, SCENE.electric.hot, 0.28 + glow * 0.35)
    const grd = ctx.createRadialGradient(x, y, 2, x, y, 12 + glow * 6)
    grd.addColorStop(0, `rgba(253, 224, 71, ${0.5 + glow * 0.45})`)
    grd.addColorStop(1, 'rgba(253, 224, 71, 0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(x, y, 12 + glow * 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = `rgba(253, 224, 71, ${0.4 + glow * 0.6})`
  ctx.beginPath()
  ctx.moveTo(x - 5, y + 8)
  ctx.lineTo(x, y - 3)
  ctx.lineTo(x + 5, y + 8)
  ctx.stroke()
  ctx.fillStyle = '#94a3b8'
  ctx.font = '10px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y + 26)
}

function drawJunction(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#94a3b8'
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
}

function drawParticles(ctx: CanvasRenderingContext2D, loop: Point[], particles: Particle[]) {
  for (const p of particles) {
    const pt = pointOnLoop(loop, p.t)
    drawGlow(ctx, pt.x, pt.y, 10, SCENE.electric.accent, 0.4)
    ctx.save()
    ctx.shadowBlur = 8
    ctx.shadowColor = SCENE.electric.glow
    ctx.fillStyle = SCENE.electric.hot
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export function SeriesParallelSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<SeriesParallelState>(DEFAULT_SERIES_PARALLEL_STATE)
  const [running, setRunning] = useState(true)
  const particlesRef = useRef<Particle[]>([])
  const readout = computeCircuit(state)

  useAnimationLoop(running, (dt) => {
    if (readout.totalCurrent <= 0) return
    if (particlesRef.current.length === 0) {
      particlesRef.current = spawnParticles(readout.totalCurrent, state.mode)
    }
    advanceParticles(particlesRef.current, readout.bulbCurrent, dt)
  })

  useEffect(() => {
    particlesRef.current = spawnParticles(readout.totalCurrent, state.mode)
  }, [state.mode, readout.totalCurrent])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    fillThemeBackground(ctx, w, h, 'electric')

    const energized = readout.totalCurrent > 0

    if (state.mode === 'series') {
      const loop = seriesLoop(w, h)
      const [tl, tr, br, bl] = loop
      drawWire(ctx, loop, energized)
      drawBattery(ctx, tl.x, (tl.y + bl.y) / 2, state.voltage)
      drawBulb(ctx, (tl.x + tr.x) / 2, tl.y, readout.bulbBrightness, 'Bulb 1')
      drawBulb(ctx, (bl.x + br.x) / 2, br.y, readout.bulbBrightness, 'Bulb 2')
      drawParticles(ctx, loop, particlesRef.current)
    } else {
      const { top, bottom, shared } = parallelLoops(w, h)
      drawWire(ctx, shared, energized, false)
      drawWire(ctx, top, energized)
      drawWire(ctx, bottom, energized)
      const leftX = shared[0].x
      const rightX = shared[2].x
      const topY = (top[0].y + top[2].y) / 2
      const botY = (bottom[0].y + bottom[2].y) / 2
      drawBattery(ctx, leftX, (topY + botY) / 2, state.voltage)
      drawBulb(ctx, (top[0].x + top[1].x) / 2, topY, readout.bulbBrightness, 'Bulb 1')
      drawBulb(ctx, (bottom[0].x + bottom[1].x) / 2, botY, readout.bulbBrightness, 'Bulb 2')
      drawJunction(ctx, leftX, topY)
      drawJunction(ctx, leftX, botY)
      drawJunction(ctx, rightX, topY)
      drawJunction(ctx, rightX, botY)

      for (const p of particlesRef.current) {
        const loop = p.branch === 0 ? top : bottom
        const pt = pointOnLoop(loop, p.t)
        drawGlow(ctx, pt.x, pt.y, 10, SCENE.electric.accent, 0.4)
        ctx.save()
        ctx.shadowBlur = 8
        ctx.shadowColor = SCENE.electric.glow
        ctx.fillStyle = SCENE.electric.hot
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Mode: ${state.mode === 'series' ? 'Series' : 'Parallel'}`, 16, 24)
  }, [w, h, state, readout])

  useEffect(() => {
    draw()
    if (!running) return
    let raf = 0
    const tick = () => {
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draw, running])

  const reset = () => {
    setState(DEFAULT_SERIES_PARALLEL_STATE)
    setRunning(true)
    particlesRef.current = []
  }

  return (
    <SimShell
      title="Series vs Parallel Circuits"
      subtitle="Compare brightness and current in two-bulb series and parallel layouts."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Circuit type</h3>
          <p className="sim-hint">Same battery powers two identical bulbs. Compare brightness and current.</p>
          <label className="sim-slider-row">
            <span>Layout</span>
            <select
              className="sim-select"
              value={state.mode}
              onChange={(e) => setState((s) => ({ ...s, mode: e.target.value as CircuitMode }))}
            >
              <option value="series">Series (one path)</option>
              <option value="parallel">Parallel (two paths)</option>
            </select>
          </label>
          <p className="sim-readout">
            <strong>Total R:</strong> {readout.totalResistance.toFixed(1)} Ω
            <br />
            <strong>Total I:</strong> {readout.totalCurrent.toFixed(2)} A
            <br />
            <strong>Per bulb I:</strong> {readout.bulbCurrent.toFixed(2)} A
            <br />
            <strong>Bulb brightness:</strong> {(readout.bulbBrightness * 100).toFixed(0)}%
          </p>
          <p className="sim-hint">
            {state.mode === 'series'
              ? 'Series: current is the same everywhere, but bulbs share voltage — dimmer.'
              : 'Parallel: each bulb gets full voltage — brighter, higher total current.'}
          </p>
        </>
      }
      toolbar={
        <SimTransport running={running} onToggle={() => setRunning((r) => !r)} onReset={reset} />
      }
    />
  )
}
