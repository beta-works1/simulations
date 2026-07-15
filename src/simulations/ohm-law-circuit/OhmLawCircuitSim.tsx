/**
 * Ohm's Law Circuit — React + Canvas recreation inspired by
 * PhET "Ohm's Law" (phetsims/ohms-law): ranges, I_mA = 1000 V/R,
 * formula letters that scale with magnitude, and AA battery stack.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  AA_VOLTAGE,
  advanceParticles,
  batteryCount,
  bulbBrightness,
  circuitLoop,
  computeCurrent,
  currentAmps,
  DEFAULT_OHM_LAW_STATE,
  formulaLetterScale,
  normalizedResistance,
  PHET_RESISTANCE,
  PHET_VOLTAGE,
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
  const width = 3.5
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

/** PhET-style AA battery stack along the left wire. */
function drawBatteries(ctx: CanvasRenderingContext2D, x: number, y: number, voltage: number) {
  const n = batteryCount(voltage)
  const cellH = 18
  const startY = y - ((n - 1) * cellH) / 2
  for (let i = 0; i < n; i++) {
    const cy = startY + i * cellH
    ctx.fillStyle = '#64748b'
    ctx.fillRect(x - 16, cy - 7, 26, 14)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(x + 10, cy - 4, 6, 8)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    ctx.strokeRect(x - 16, cy - 7, 26, 14)
  }
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 12px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${voltage.toFixed(1)} V`, x - 36, y + 4)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '10px Roboto, sans-serif'
  ctx.fillText(`${n}×${AA_VOLTAGE} V`, x - 36, y + 18)
}

/** Resistor thickness grows with resistance (PhET ResistorNode idea). */
function drawResistor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const t = normalizedResistance(r)
  const w = 48 + t * 36
  const h = 12 + t * 14
  ctx.save()
  ctx.shadowBlur = 8
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.fillStyle = '#b45309'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 4)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 1.5
  ctx.stroke()
  const bands = ['#1e293b', '#f59e0b', '#ef4444', '#22c55e']
  bands.forEach((c, i) => {
    const bx = x - w / 2 + 10 + i * ((w - 20) / 4)
    ctx.fillStyle = c
    ctx.fillRect(bx, y - h / 2 + 2, 5, h - 4)
  })
  ctx.fillStyle = '#f8fafc'
  ctx.font = '600 12px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(r)} Ω`, x, y + h / 2 + 16)
}

function drawBulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brightness: number,
  powered: boolean,
) {
  const glow = powered ? brightness : 0
  if (glow > 0.02) {
    drawGlow(ctx, x, y, 30 + glow * 40, SCENE.electric.hot, 0.25 + glow * 0.4)
  }
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(x, y, 16, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = powered ? `rgba(253, 224, 71, ${0.45 + glow * 0.55})` : '#475569'
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
  else ctx.lineTo(x + 10, y - 14)
  ctx.stroke()
}

/** PhET FormulaNode: I = V / R with letter sizes tied to magnitude. */
function drawFormula(ctx: CanvasRenderingContext2D, w: number, state: OhmLawState) {
  const iScale = formulaLetterScale('I', state)
  const vScale = formulaLetterScale('V', state)
  const rScale = formulaLetterScale('R', state)
  const base = 22
  const cx = w * 0.5
  const y = 42

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#f87171'
  ctx.font = `700 ${base * iScale}px Roboto, sans-serif`
  ctx.fillText('I', cx - 70, y)

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `700 ${base * 1.4}px Roboto, sans-serif`
  ctx.fillText('=', cx - 40, y)

  ctx.fillStyle = '#38bdf8'
  ctx.font = `700 ${base * vScale}px Roboto, sans-serif`
  ctx.fillText('V', cx - 5, y)

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `700 ${base}px Roboto, sans-serif`
  ctx.fillText('/', cx + 28, y)

  ctx.fillStyle = '#4ade80'
  ctx.font = `700 ${base * rScale}px Roboto, sans-serif`
  ctx.fillText('R', cx + 58, y)
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
  const [showAmps, setShowAmps] = useState(false)
  const particlesRef = useRef<Particle[]>([])
  const milliamps = computeCurrent(state)
  const amps = currentAmps(milliamps)
  const brightness = bulbBrightness(milliamps)

  useAnimationLoop(running && state.switchClosed, (dt) => {
    if (milliamps <= 0) return
    if (particlesRef.current.length === 0) particlesRef.current = spawnParticles(milliamps)
    advanceParticles(particlesRef.current, milliamps, dt)
  })

  useEffect(() => {
    if (!state.switchClosed || milliamps <= 0) particlesRef.current = []
    else particlesRef.current = spawnParticles(milliamps)
  }, [state.switchClosed, milliamps])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    fillThemeBackground(ctx, w, h, 'electric')
    drawFormula(ctx, w, state)

    const loop = circuitLoop(w, h)
    const energized = state.switchClosed && milliamps > 0
    const [tl, tr, br, bl] = loop
    const topMid = { x: (tl.x + tr.x) / 2, y: tl.y }
    const rightMid = { x: tr.x, y: (tr.y + br.y) / 2 }
    const bottomMid = { x: (bl.x + br.x) / 2, y: br.y }
    const leftMid = { x: tl.x, y: (tl.y + bl.y) / 2 }

    drawWire(ctx, loop, energized)
    drawBatteries(ctx, leftMid.x, leftMid.y, state.voltage)
    drawResistor(ctx, topMid.x, topMid.y, state.resistance)
    drawBulb(ctx, rightMid.x, rightMid.y, brightness, state.switchClosed)
    drawSwitch(ctx, bottomMid.x, bottomMid.y, state.switchClosed)

    if (energized) drawParticles(ctx, loop, particlesRef.current)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Adapted from PhET Ohm’s Law model (I = 1000·V/R mA)', 14, h - 14)
  }, [w, h, state, milliamps, brightness])

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

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const loop = circuitLoop(size.w, size.h)
      const [tl, tr, br, bl] = loop
      const topMid = { x: (tl.x + tr.x) / 2, y: tl.y }
      const bottomMid = { x: (bl.x + br.x) / 2, y: br.y }
      const leftMid = { x: tl.x, y: (tl.y + bl.y) / 2 }
      if (Math.hypot(pt.x - leftMid.x, pt.y - leftMid.y) < 42) return 'battery'
      if (Math.hypot(pt.x - topMid.x, pt.y - topMid.y) < 48) return 'resistor'
      if (Math.hypot(pt.x - bottomMid.x, pt.y - bottomMid.y) < 36) return 'switch'
      return null
    },
    cursorForHit: (id) => (id === 'switch' ? 'pointer' : 'grab'),
    onDrag: (id, pt, size) => {
      if (id === 'battery') {
        const t = clamp(1 - pt.y / Math.max(1, size.h), 0, 1)
        const voltage = Math.round((PHET_VOLTAGE.min + t * (PHET_VOLTAGE.max - PHET_VOLTAGE.min)) * 10) / 10
        setState((s) => ({ ...s, voltage }))
      } else if (id === 'resistor') {
        const t = clamp(pt.x / Math.max(1, size.w), 0, 1)
        const resistance = Math.round(PHET_RESISTANCE.min + t * (PHET_RESISTANCE.max - PHET_RESISTANCE.min))
        setState((s) => ({ ...s, resistance }))
      }
    },
    onTap: (id) => {
      if (id === 'switch') setState((s) => ({ ...s, switchClosed: !s.switchClosed }))
    },
  })

  return (
    <SimShell
      title="Ohm's Law"
      subtitle="PhET-style model: voltage, resistance, and current (mA)"
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Controls</h3>
          <p className="sim-hint">
            Ranges match PhET Ohm&apos;s Law: V 0.1–9 V, R 10–1000 Ω. Letter sizes grow with
            magnitude.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Voltage</span>
              <span>{state.voltage.toFixed(1)} V</span>
            </label>
            <input
              type="range"
              min={PHET_VOLTAGE.min}
              max={PHET_VOLTAGE.max}
              step={0.1}
              value={state.voltage}
              onChange={(e) => setState((s) => ({ ...s, voltage: Number(e.target.value) }))}
            />
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Resistance</span>
              <span>{Math.round(state.resistance)} Ω</span>
            </label>
            <input
              type="range"
              min={PHET_RESISTANCE.min}
              max={PHET_RESISTANCE.max}
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
              onChange={(e) =>
                setState((s) => ({ ...s, switchClosed: e.target.value === 'closed' }))
              }
            >
              <option value="closed">Closed (on)</option>
              <option value="open">Open (off)</option>
            </select>
          </label>
          <label className="sim-slider-row">
            <span>Current units</span>
            <select
              className="sim-select"
              value={showAmps ? 'A' : 'mA'}
              onChange={(e) => setShowAmps(e.target.value === 'A')}
            >
              <option value="mA">milliamps (mA)</option>
              <option value="A">amps (A)</option>
            </select>
          </label>
          <p className="sim-readout">
            <strong>I = V / R</strong>
            <br />
            {showAmps ? (
              <>
                I = {amps.toFixed(4)} <strong>A</strong>
              </>
            ) : (
              <>
                I = {milliamps.toFixed(2)} <strong>mA</strong>
              </>
            )}
            <br />
            Brightness: {(brightness * 100).toFixed(0)}%
          </p>
        </>
      }
      toolbar={
        <SimTransport running={running} onToggle={() => setRunning((r) => !r)} onReset={reset} />
      }
    />
  )
}
