import { useCallback, useEffect, useRef, useState } from 'react'
import { drawGlow, fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  advanceParticles,
  bulbBrightness,
  circuitLoop,
  computeCurrent,
  DEFAULT_OHM_LAW_STATE,
  pointOnLoop,
  spawnParticles,
  type OhmLawState,
  type Particle,
  type Point,
} from './model'

function wirePath(ctx: CanvasRenderingContext2D, points: Point[], closed = true) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  if (closed) ctx.closePath()
}

function drawWire(ctx: CanvasRenderingContext2D, points: Point[], energized = false) {
  const color = energized ? SCENE.electric.accent : '#64748b'
  const width = 3
  if (energized) {
    strokeWithGlow(ctx, () => wirePath(ctx, points), color, width, SCENE.electric.glow)
  } else {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    wirePath(ctx, points)
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

function drawResistor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const w = 52
  const h = 16
  ctx.fillStyle = '#d97706'
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(x - w / 2, y - h / 2, w, h)
  ctx.fill()
  ctx.stroke()
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(x + i * 10, y - h / 2)
    ctx.lineTo(x + i * 10 + 5, y + h / 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '11px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${r} Ω`, x, y + 28)
}

function drawBulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brightness: number,
  powered: boolean,
) {
  const glow = powered ? brightness : 0
  if (glow > 0.05) {
    drawGlow(ctx, x, y, 28 + glow * 22, SCENE.electric.hot, 0.3 + glow * 0.35)
    const grd = ctx.createRadialGradient(x, y, 2, x, y, 14 + glow * 8)
    grd.addColorStop(0, `rgba(253, 224, 71, ${0.55 + glow * 0.4})`)
    grd.addColorStop(1, 'rgba(253, 224, 71, 0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(x, y, 14 + glow * 8, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 14, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = powered ? `rgba(253, 224, 71, ${0.5 + glow * 0.5})` : '#475569'
  ctx.beginPath()
  ctx.moveTo(x - 6, y + 10)
  ctx.lineTo(x, y - 4)
  ctx.lineTo(x + 6, y + 10)
  ctx.stroke()
}

function drawSwitch(ctx: CanvasRenderingContext2D, x: number, y: number, closed: boolean) {
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(x - 16, y, 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + 16, y, 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 16, y)
  if (closed) ctx.lineTo(x + 16, y)
  else {
    ctx.lineTo(x + 10, y - 14)
  }
  ctx.stroke()
  ctx.fillStyle = closed ? '#4ade80' : '#f87171'
  ctx.font = '10px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(closed ? 'CLOSED' : 'OPEN', x, y + 28)
}

function drawParticles(ctx: CanvasRenderingContext2D, loop: Point[], particles: Particle[]) {
  for (const p of particles) {
    const pt = pointOnLoop(loop, p.t)
    drawGlow(ctx, pt.x, pt.y, 12, SCENE.electric.accent, 0.45)
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = SCENE.electric.glow
    ctx.fillStyle = SCENE.electric.hot
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export function OhmLawCircuitSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<OhmLawState>(DEFAULT_OHM_LAW_STATE)
  const [running, setRunning] = useState(true)
  const particlesRef = useRef<Particle[]>([])
  const current = computeCurrent(state)
  const brightness = bulbBrightness(current)

  useAnimationLoop(running && state.switchClosed, (dt) => {
    if (current <= 0) return
    if (particlesRef.current.length === 0) particlesRef.current = spawnParticles(current)
    advanceParticles(particlesRef.current, current, dt)
  })

  useEffect(() => {
    if (!state.switchClosed || current <= 0) particlesRef.current = []
    else if (particlesRef.current.length === 0) particlesRef.current = spawnParticles(current)
  }, [state.switchClosed, current])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    fillThemeBackground(ctx, w, h, 'electric')

    const loop = circuitLoop(w, h)
    const energized = state.switchClosed && current > 0
    const [tl, tr, br, bl] = loop
    const topMid = { x: (tl.x + tr.x) / 2, y: tl.y }
    const rightMid = { x: tr.x, y: (tr.y + br.y) / 2 }
    const bottomMid = { x: (bl.x + br.x) / 2, y: br.y }
    const leftMid = { x: tl.x, y: (tl.y + bl.y) / 2 }

    drawWire(ctx, loop, energized)
    drawBattery(ctx, leftMid.x, leftMid.y, state.voltage)
    drawResistor(ctx, topMid.x, topMid.y, state.resistance)
    drawBulb(ctx, rightMid.x, rightMid.y, brightness, state.switchClosed)
    drawSwitch(ctx, bottomMid.x, bottomMid.y, state.switchClosed)

    if (state.switchClosed && current > 0) {
      drawParticles(ctx, loop, particlesRef.current)
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText("Ohm's Law: I = V / R", 16, 24)
  }, [w, h, state, current, brightness])

  useEffect(() => {
    draw()
    if (!running || !state.switchClosed) return
    let raf = 0
    const tick = () => {
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draw, running, state.switchClosed])

  const reset = () => {
    setState(DEFAULT_OHM_LAW_STATE)
    setRunning(true)
    particlesRef.current = []
  }

  return (
    <SimShell
      title="Ohm's Law Circuit"
      subtitle="Relate voltage, current, and resistance with a glowing bulb."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Circuit</h3>
          <p className="sim-hint">Adjust voltage and resistance. Close the switch to let current flow.</p>
          <div className="sim-slider-row">
            <label>
              <span>Voltage (V)</span>
              <span>{state.voltage} V</span>
            </label>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={state.voltage}
              onChange={(e) => setState((s) => ({ ...s, voltage: Number(e.target.value) }))}
            />
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Resistance (Ω)</span>
              <span>{state.resistance} Ω</span>
            </label>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={state.resistance}
              onChange={(e) => setState((s) => ({ ...s, resistance: Number(e.target.value) }))}
            />
          </div>
          <label className="sim-slider-row">
            <span>Switch</span>
            <select
              className="sim-select"
              value={state.switchClosed ? 'closed' : 'open'}
              onChange={(e) => setState((s) => ({ ...s, switchClosed: e.target.value === 'closed' }))}
            >
              <option value="closed">Closed (on)</option>
              <option value="open">Open (off)</option>
            </select>
          </label>
          <p className="sim-readout">
            <strong>I = V / R</strong>
            <br />
            I = {state.voltage} / {state.resistance} = <strong>{current.toFixed(2)} A</strong>
            <br />
            Bulb brightness: {(brightness * 100).toFixed(0)}%
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={reset}
        />
      }
    />
  )
}
