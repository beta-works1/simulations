import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  advanceParticles,
  computeCircuit,
  DEFAULT_SHORT_CIRCUIT_STATE,
  mainLoop,
  pointOnPath,
  resetFuse,
  shortBypass,
  spawnParticles,
  type Particle,
  type Point,
  type ShortCircuitState,
} from './model'

function wirePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
}

function drawWire(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color = '#64748b',
  width = 3,
  energized = false,
  glowColor?: string,
) {
  if (energized) {
    strokeWithGlow(ctx, () => wirePath(ctx, points), color, width, glowColor ?? SCENE.electric.glow)
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

function drawFuse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rating: number,
  blown: boolean,
) {
  const w = 40
  const h = 14
  ctx.fillStyle = blown ? '#374151' : '#fef3c7'
  ctx.strokeStyle = blown ? '#6b7280' : '#fbbf24'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(x - w / 2, y - h / 2, w, h)
  ctx.fill()
  ctx.stroke()
  if (!blown) {
    ctx.strokeStyle = '#b45309'
    ctx.beginPath()
    ctx.moveTo(x - 12, y)
    ctx.lineTo(x + 12, y)
    ctx.stroke()
  } else {
    ctx.strokeStyle = '#ef4444'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(x - 12, y - 4)
    ctx.lineTo(x + 12, y + 4)
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.fillStyle = blown ? '#f87171' : '#fde68a'
  ctx.font = '10px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(blown ? 'BLOWN' : `${rating} A`, x, y + 24)
}

function drawLoad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  powered: boolean,
  shorted: boolean,
) {
  const w = 56
  const h = 28
  ctx.fillStyle = shorted ? '#1f2937' : powered ? '#1e3a5f' : '#1f2937'
  ctx.strokeStyle = shorted ? '#ef4444' : powered ? '#38bdf8' : '#475569'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.rect(x - w / 2, y - h / 2, w, h)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '11px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(shorted ? 'Bypassed' : 'Load', x, y + 4)
}

export function ShortCircuitFuseSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<ShortCircuitState>(DEFAULT_SHORT_CIRCUIT_STATE)
  const [running, setRunning] = useState(true)
  const particlesRef = useRef<Particle[]>([])
  const readout = computeCircuit(state)

  useEffect(() => {
    if (!state.fuseBlown && !readout.fuseIntact) {
      setState((s) => ({ ...s, fuseBlown: true }))
    }
  }, [state.fuseBlown, readout.fuseIntact])

  useAnimationLoop(running && !state.fuseBlown && readout.current > 0, (dt) => {
    if (particlesRef.current.length === 0) particlesRef.current = spawnParticles(readout.current)
    advanceParticles(particlesRef.current, readout.current, dt)
  })

  useEffect(() => {
    particlesRef.current = spawnParticles(readout.current)
  }, [state.shorted, state.fuseBlown, readout.current])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    fillThemeBackground(ctx, w, h, 'electric')

    const loop = mainLoop(w, h)
    const bypass = shortBypass(w, h)
    const [tl, tr, br, bl] = loop
    const energized = !state.fuseBlown && readout.current > 0

    drawWire(ctx, loop, '#64748b', 3, energized)
    if (state.shorted) {
      drawWire(ctx, bypass, '#ef4444', 4, energized, 'rgba(239, 68, 68, 0.45)')
      ctx.fillStyle = '#fca5a5'
      ctx.font = '10px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SHORT!', (bypass[1].x + bypass[2].x) / 2, bypass[1].y - 10)
    }

    drawBattery(ctx, tl.x, (tl.y + bl.y) / 2, state.voltage)
    drawFuse(ctx, (tl.x + tr.x) / 2, tl.y, state.fuseRating, state.fuseBlown)
    drawLoad(ctx, tr.x, (tr.y + br.y) / 2, readout.loadPowered, state.shorted)

    if (energized) {
      for (const p of particlesRef.current) {
        const pt = pointOnPath(loop, p.t, true)
        const particleColor = state.shorted ? '#f87171' : SCENE.electric.hot
        const glow = state.shorted ? 'rgba(248, 113, 113, 0.5)' : SCENE.electric.glow
        drawGlow(ctx, pt.x, pt.y, state.shorted ? 14 : 10, particleColor, 0.45)
        ctx.save()
        ctx.shadowBlur = state.shorted ? 12 : 8
        ctx.shadowColor = glow
        ctx.fillStyle = particleColor
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, state.shorted ? 4 : 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    if (state.fuseBlown) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#f87171'
      ctx.font = 'bold 14px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Fuse blown — circuit open', w / 2, h - 20)
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Short circuit & fuse protection', 16, 24)
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
    setState(resetFuse(DEFAULT_SHORT_CIRCUIT_STATE))
    setRunning(true)
    particlesRef.current = []
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const loop = mainLoop(size.w, size.h)
      const [tl, tr] = loop
      const fuseX = (tl.x + tr.x) / 2
      const fuseY = tl.y
      if (Math.hypot(pt.x - fuseX, pt.y - fuseY) < 36) return 'fuse'
      const bypass = shortBypass(size.w, size.h)
      const midX = (bypass[1].x + bypass[2].x) / 2
      const midY = bypass[1].y
      if (Math.abs(pt.y - midY) < 28 && pt.x >= bypass[1].x - 10 && pt.x <= bypass[2].x + 10) {
        return 'short'
      }
      return null
    },
    cursorForHit: (id) => {
      if (id === 'short') return 'pointer'
      if (id === 'fuse' && state.fuseBlown) return 'pointer'
      return 'grab'
    },
    onDrag: (id, pt, size) => {
      if (id !== 'fuse') return
      setState((s) => {
        if (s.fuseBlown) return s
        const rating = clamp(Math.round((1 + (pt.x / Math.max(1, size.w)) * 4) * 2) / 2, 1, 5)
        return { ...s, fuseRating: rating }
      })
    },
    onTap: (id) => {
      if (id === 'short') {
        setState((s) => (s.fuseBlown ? s : { ...s, shorted: !s.shorted, fuseBlown: false }))
      } else if (id === 'fuse') {
        setState((s) => (s.fuseBlown ? resetFuse(s) : s))
      }
    },
  })

  return (
    <SimShell
      title="Short Circuit & Fuse"
      subtitle="Watch current spike on a short and see how a fuse protects the circuit."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Protection</h3>
          <p className="sim-hint">
            A fuse limits current. A short circuit bypasses the load and can blow the fuse.
          </p>
          <label className="sim-slider-row">
            <span>Condition</span>
            <select
              className="sim-select"
              value={state.shorted ? 'short' : 'normal'}
              onChange={(e) =>
                setState((s) => ({ ...s, shorted: e.target.value === 'short', fuseBlown: false }))
              }
              disabled={state.fuseBlown}
            >
              <option value="normal">Normal load</option>
              <option value="short">Short across load</option>
            </select>
          </label>
          <div className="sim-slider-row">
            <label>
              <span>Fuse rating (A)</span>
              <span>{state.fuseRating} A</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={state.fuseRating}
              onChange={(e) => setState((s) => ({ ...s, fuseRating: Number(e.target.value) }))}
              disabled={state.fuseBlown}
            />
          </div>
          <p className="sim-readout">
            <strong>Current:</strong> {readout.current.toFixed(1)} A
            <br />
            <strong>Fuse:</strong>{' '}
            {state.fuseBlown ? 'OPEN (blown)' : readout.fuseIntact ? 'OK' : 'OVERLOAD'}
            <br />
            <strong>Load:</strong> {readout.loadPowered ? 'Powered' : 'Off'}
          </p>
          {state.shorted && !state.fuseBlown && readout.current > state.fuseRating && (
            <p className="sim-hint" style={{ color: '#f87171' }}>
              Current exceeds fuse rating — fuse will blow!
            </p>
          )}
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={reset}
          extra={
            state.fuseBlown ? (
              <button type="button" className="sim-btn" onClick={reset}>
                Replace fuse
              </button>
            ) : null
          }
        />
      }
    />
  )
}
