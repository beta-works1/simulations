/**
 * Gravity and Orbits — React + Canvas recreation from PhET gravity-and-orbits masses.
 */
import { useRef, useState } from 'react'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, drawStarfield, fillThemeBackground } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createOrbitState,
  EARTH_MASS,
  MOON_MASS,
  stepOrbit,
  SUN_MASS,
  type OrbitMode,
  type OrbitState,
} from './model'

type BodyLayout = {
  cx: number
  cy: number
  scale: number
  moverX: number
  moverY: number
  moverR: number
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: OrbitState,
  layoutRef: React.MutableRefObject<BodyLayout | null>,
  frozenScale: React.MutableRefObject<number | null>,
) {
  fillThemeBackground(ctx, w, h, 'space')
  drawStarfield(ctx, w, h, 48, 80)

  const cx = w * 0.5
  const cy = h * 0.5
  const bodies = state.bodies
  let maxR = 1
  for (const b of bodies) {
    maxR = Math.max(maxR, Math.hypot(b.x, b.y))
    for (const t of b.trail) maxR = Math.max(maxR, Math.hypot(t.x, t.y))
  }
  const scale = frozenScale.current ?? (Math.min(w, h) * 0.38) / maxR

  for (const b of bodies) {
    if (b.trail.length > 1) {
      ctx.strokeStyle = `${b.color}99`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      b.trail.forEach((p, i) => {
        const x = cx + p.x * scale
        const y = cy + p.y * scale
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
  }

  for (const b of bodies) {
    const x = cx + b.x * scale
    const y = cy + b.y * scale
    drawGlow(ctx, x, y, b.radius * 3, b.color, 0.35)
    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.arc(x, y, b.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '600 11px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(b.label, x, y + b.radius + 14)
  }

  const mover = bodies[1]
  if (mover) {
    layoutRef.current = {
      cx,
      cy,
      scale,
      moverX: cx + mover.x * scale,
      moverY: cy + mover.y * scale,
      moverR: mover.radius,
    }
  }

  ctx.fillStyle = 'rgba(15,23,42,0.88)'
  ctx.fillRect(16, 16, 240, 40)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 12px Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(
    state.gravityOn ? 'Gravity ON · F = G m₁ m₂ / r²' : 'Gravity OFF',
    28,
    40,
  )
}

export function GravityAndOrbitsSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<OrbitState>(createOrbitState('sun-earth'))
  const layoutRef = useRef<BodyLayout | null>(null)
  const frozenScale = useRef<number | null>(null)
  const runningRef = useRef(true)
  const resumeAfterDrag = useRef(false)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<OrbitMode>('sun-earth')
  const [gravityOn, setGravityOn] = useState(true)
  const [note, setNote] = useState('Sun–Earth perihelion orbit')

  runningRef.current = running
  stateRef.current.gravityOn = gravityOn

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepOrbit(s, dt),
    draw: (ctx, ww, hh, s) => draw(ctx, ww, hh, s, layoutRef, frozenScale),
    onSync: (s) => {
      const mover = s.bodies[1]
      if (!mover) return
      setNote(
        `${mover.label}: r ≈ ${Math.hypot(mover.x, mover.y).toFixed(2)} scene units`,
      )
    },
  })

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.moverX, pt.y - L.moverY) < L.moverR + 18) return 'mover'
      return null
    },
    onDragStart: () => {
      resumeAfterDrag.current = runningRef.current
      frozenScale.current = layoutRef.current?.scale ?? null
      setRunning(false)
    },
    onDrag: (_id, pt) => {
      const L = layoutRef.current
      const mover = stateRef.current.bodies[1]
      if (!L || !mover) return
      mover.x = (pt.x - L.cx) / L.scale
      mover.y = (pt.y - L.cy) / L.scale
      mover.trail = []
    },
    onDragEnd: () => {
      frozenScale.current = null
      if (resumeAfterDrag.current) setRunning(true)
    },
  })

  const switchMode = (m: OrbitMode) => {
    setMode(m)
    stateRef.current = createOrbitState(m)
    stateRef.current.gravityOn = gravityOn
  }

  const reset = () => {
    stateRef.current = createOrbitState(mode)
    stateRef.current.gravityOn = gravityOn
  }

  const sidebar = (
    <>
      <h3>System</h3>
      <select
        className="sim-select"
        value={mode}
        onChange={(e) => switchMode(e.target.value as OrbitMode)}
      >
        <option value="sun-earth">Sun and Earth</option>
        <option value="earth-moon">Earth and Moon</option>
      </select>
      <label className="sim-check">
        <input
          type="checkbox"
          checked={gravityOn}
          onChange={(e) => setGravityOn(e.target.checked)}
        />
        Gravity on
      </label>
      <p className="sim-readout">{note}</p>
      <p className="sim-hint" style={{ fontSize: 12, color: '#94a3b8' }}>
        Drag the orbiting body to set its position (simulation pauses while dragging). Masses from
        PhET: Sun {SUN_MASS.toExponential(3)} kg, Earth {EARTH_MASS.toExponential(3)} kg, Moon{' '}
        {MOON_MASS.toExponential(3)} kg
      </p>
    </>
  )

  return (
    <SimShell
      title="Gravity and Orbits"
      subtitle="Newtonian gravity with PhET body masses"
      canvasRef={canvasRef}
      sidebar={sidebar}
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
