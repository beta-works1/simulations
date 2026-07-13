import { useCallback, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  collapseRadius,
  createInitialState,
  eventHorizonRadius,
  phaseLabel,
  photonPaths,
  stepBlackHole,
  type BlackHoleState,
} from './model'

function drawBlackHole(ctx: CanvasRenderingContext2D, w: number, h: number, state: BlackHoleState) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 90; i++) {
    const x = ((i * 6151) % 1000) / 1000 * w
    const y = ((i * 3571) % 1000) / 1000 * h
    ctx.fillStyle = `rgba(255,255,255,${0.12 + (i % 6) / 15})`
    ctx.beginPath()
    ctx.arc(x, y, 0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  const cx = w * 0.5
  const cy = h * 0.5

  if (state.phase === 'collapse') {
    const r = collapseRadius(state.collapseProgress) * 70
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 40)
    g.addColorStop(0, '#fff8e1')
    g.addColorStop(0.2, '#ff8a65')
    g.addColorStop(0.5, '#d32f2f')
    g.addColorStop(0.8, 'rgba(80,20,20,0.5)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r + 40, 0, Math.PI * 2)
    ctx.fill()

    if (state.collapseProgress > 0.5) {
      const bhR = eventHorizonRadius() * (state.collapseProgress - 0.5) * 2
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(cx, cy, bhR, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    const ehR = eventHorizonRadius()
    const diskR = ehR * 2.8
    const disk = ctx.createRadialGradient(cx, cy, ehR, cx, cy, diskR)
    disk.addColorStop(0, 'rgba(255,160,60,0)')
    disk.addColorStop(0.3, 'rgba(255,130,50,0.65)')
    disk.addColorStop(0.6, 'rgba(160,80,220,0.4)')
    disk.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = disk
    ctx.beginPath()
    ctx.ellipse(cx, cy, diskR, diskR * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()

    const paths = photonPaths(cx, cy, state.bendTime)
    paths.forEach((p, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(state.bendTime * 3 + i)
      ctx.strokeStyle = p.captured
        ? `rgba(255,100,80,${0.5 + pulse * 0.4})`
        : `rgba(120,220,255,${0.45 + pulse * 0.35})`
      ctx.lineWidth = p.captured ? 2.5 : 1.5
      ctx.beginPath()
      ctx.moveTo(p.startX, p.startY)
      ctx.bezierCurveTo(p.cp1X, p.cp1Y, p.cp2X, p.cp2Y, p.endX, p.endY)
      ctx.stroke()
    })

    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(cx, cy, ehR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,200,100,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, ehR + 1.5, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(15,23,42,0.88)'
  ctx.fillRect(16, 16, 220, 36)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 13px Roboto, sans-serif'
  ctx.fillText(phaseLabel(state.phase), 28, 38)
}

export function BlackHoleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<BlackHoleState>(createInitialState())
  const [running, setRunning] = useState(true)
  const [phase, setPhase] = useState(phaseLabel(createInitialState().phase))
  const [detail, setDetail] = useState('Collapse: 0%')

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepBlackHole({ ...s, running: true }, dt),
    draw: drawBlackHole,
    onSync: (s) => {
      setPhase(phaseLabel(s.phase))
      setDetail(
        s.phase === 'collapse'
          ? `Collapse: ${(s.collapseProgress * 100).toFixed(0)}%`
          : 'Gravitational lensing active',
      )
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setRunning(true)
  }, [])

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Black Hole</h3>
          <p className="sim-hint">
            Watch a massive star collapse into a black hole, then see how light paths bend — and
            some photons fall in past the event horizon.
          </p>
          <p className="sim-readout">
            Phase: {phase}
            <br />
            {detail}
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
