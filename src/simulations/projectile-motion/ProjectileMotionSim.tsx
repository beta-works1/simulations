/**
 * Projectile Motion — React + Canvas recreation from PhET projectile-motion.
 */
import { useRef, useState } from 'react'
import { fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  defaultLaunchParams,
  emptyFlight,
  fireProjectile,
  PHET,
  PROJECTILE_TYPES,
  stepFlight,
  type FlightState,
  type LaunchParams,
} from './model'

type SimState = { params: LaunchParams; flight: FlightState }

function createInitial(): SimState {
  const params = defaultLaunchParams()
  return { params, flight: emptyFlight(params.height) }
}

function worldToCanvas(
  wx: number,
  wy: number,
  w: number,
  h: number,
  maxX: number,
  maxY: number,
) {
  const marginL = 56
  const marginB = 48
  const marginT = 28
  const marginR = 24
  const plotW = w - marginL - marginR
  const plotH = h - marginB - marginT
  const sx = plotW / Math.max(maxX, 1)
  const sy = plotH / Math.max(maxY, 1)
  const s = Math.min(sx, sy)
  return {
    x: marginL + wx * s,
    y: h - marginB - wy * s,
    s,
    originX: marginL,
    groundY: h - marginB,
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SimState,
) {
  fillThemeBackground(ctx, w, h, 'force')
  const { params, flight } = state
  const maxX = Math.max(40, flight.range * 1.15, 25)
  const maxY = Math.max(params.height + 5, flight.apex * 1.15, 16)

  const o = worldToCanvas(0, 0, w, h, maxX, maxY)

  // Ground
  ctx.fillStyle = 'rgba(34, 197, 94, 0.25)'
  ctx.fillRect(0, o.groundY, w, h - o.groundY)
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, o.groundY)
  ctx.lineTo(w, o.groundY)
  ctx.stroke()

  // Grid ticks
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px Roboto, sans-serif'
  ctx.textAlign = 'center'
  for (let m = 0; m <= maxX; m += 5) {
    const p = worldToCanvas(m, 0, w, h, maxX, maxY)
    ctx.strokeStyle = 'rgba(148,163,184,0.25)'
    ctx.beginPath()
    ctx.moveTo(p.x, o.groundY)
    ctx.lineTo(p.x, 20)
    ctx.stroke()
    ctx.fillText(`${m} m`, p.x, o.groundY + 16)
  }

  // Cannon
  const muzzle = worldToCanvas(0, params.height, w, h, maxX, maxY)
  const rad = (params.angleDeg * Math.PI) / 180
  const barrel = 36
  ctx.save()
  ctx.translate(muzzle.x, muzzle.y)
  ctx.rotate(-rad)
  ctx.fillStyle = '#475569'
  ctx.fillRect(0, -7, barrel, 14)
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(0, 0, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Wheel stand
  ctx.fillStyle = '#64748b'
  ctx.fillRect(muzzle.x - 18, muzzle.y, 12, o.groundY - muzzle.y)
  ctx.beginPath()
  ctx.arc(muzzle.x - 12, o.groundY - 10, 10, 0, Math.PI * 2)
  ctx.fill()

  // Path
  if (flight.path.length > 1) {
    const color = params.airResistance ? 'rgb(252, 40, 252)' : SCENE.force.accent
    strokeWithGlow(
      ctx,
      () => {
        ctx.beginPath()
        flight.path.forEach((pt, i) => {
          const p = worldToCanvas(pt.x, pt.y, w, h, maxX, maxY)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
      },
      color,
      2,
      params.airResistance ? 'rgba(252,40,252,0.4)' : 'rgba(59,130,246,0.35)',
    )
  }

  // Projectile
  const type = PROJECTILE_TYPES.find((t) => t.id === params.typeId) ?? PROJECTILE_TYPES[1]
  const pos = worldToCanvas(flight.x, flight.y, w, h, maxX, maxY)
  const r = Math.max(5, Math.min(16, type.diameter * 28))
  ctx.fillStyle = type.id === 'pumpkin' ? '#f97316' : '#e2e8f0'
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 1
  ctx.stroke()
}

export function ProjectileMotionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<SimState>(createInitial())
  const [running, setRunning] = useState(true)
  const [params, setParams] = useState(() => defaultLaunchParams())
  const [readout, setReadout] = useState('Ready to fire')

  stateRef.current.params = params

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => {
      if (!s.flight.flying) return s
      return { ...s, flight: stepFlight(s.flight, s.params, dt) }
    },
    draw,
    onSync: (s) => {
      if (s.flight.flying) {
        setReadout(
          `t = ${s.flight.flightTime.toFixed(2)} s · x = ${s.flight.x.toFixed(1)} m · y = ${s.flight.y.toFixed(1)} m`,
        )
      } else if (s.flight.path.length > 1) {
        setReadout(
          `Range ${s.flight.range.toFixed(1)} m · apex ${s.flight.apex.toFixed(1)} m · flight ${s.flight.flightTime.toFixed(2)} s`,
        )
      }
    },
  })

  const update = (patch: Partial<LaunchParams>) => {
    setParams((p) => {
      const next = { ...p, ...patch }
      if (!stateRef.current.flight.flying) {
        stateRef.current = { params: next, flight: emptyFlight(next.height) }
      } else {
        stateRef.current.params = next
      }
      return next
    })
  }

  const fire = () => {
    const flight = fireProjectile(params)
    stateRef.current = { params, flight }
    setRunning(true)
    setReadout('In flight…')
  }

  const reset = () => {
    const p = defaultLaunchParams()
    setParams(p)
    stateRef.current = { params: p, flight: emptyFlight(p.height) }
    setReadout('Ready to fire')
  }

  const sidebar = (
    <>
      <h3>Launch</h3>
      <label className="sim-label">
        Projectile
        <select
          className="sim-select"
          value={params.typeId}
          onChange={(e) => update({ typeId: e.target.value })}
        >
          {PROJECTILE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} ({t.mass} kg)
            </option>
          ))}
        </select>
      </label>
      <div className="sim-slider-row">
        <label>
          <span>Angle</span>
          <span>{params.angleDeg}°</span>
        </label>
        <input
          type="range"
          min={PHET.angleRange[0]}
          max={PHET.angleRange[1]}
          value={params.angleDeg}
          onChange={(e) => update({ angleDeg: Number(e.target.value) })}
        />
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Speed</span>
          <span>{params.speed} m/s</span>
        </label>
        <input
          type="range"
          min={PHET.speedRange[0]}
          max={PHET.speedRange[1]}
          value={params.speed}
          onChange={(e) => update({ speed: Number(e.target.value) })}
        />
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Cannon height</span>
          <span>{params.height} m</span>
        </label>
        <input
          type="range"
          min={PHET.heightRange[0]}
          max={PHET.heightRange[1]}
          value={params.height}
          onChange={(e) => update({ height: Number(e.target.value) })}
        />
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Gravity</span>
          <span>{params.gravity.toFixed(1)} m/s²</span>
        </label>
        <input
          type="range"
          min={PHET.gravityRange[0]}
          max={PHET.gravityRange[1]}
          step={0.1}
          value={params.gravity}
          onChange={(e) => update({ gravity: Number(e.target.value) })}
        />
      </div>
      <label className="sim-check">
        <input
          type="checkbox"
          checked={params.airResistance}
          onChange={(e) => update({ airResistance: e.target.checked })}
        />
        Air resistance (ρ = {PHET.airDensity} kg/m³)
      </label>
      <p className="sim-readout">{readout}</p>
      <button type="button" className="sim-btn is-active" onClick={fire}>
        Fire
      </button>
    </>
  )

  return (
    <SimShell
      title="Projectile Motion"
      subtitle="PhET Intro defaults — kinematics + optional quadratic drag"
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
