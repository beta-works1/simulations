/**
 * Balancing Act — React + Canvas recreation from PhET balancing-act Plank model.
 */
import { useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { fillThemeBackground } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  defaultBalanceState,
  isBalanced,
  MYSTERY_MASSES,
  netTorque,
  PLANK_LENGTH,
  snapDistance,
  stepBalance,
  type BalanceState,
} from './model'

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, state: BalanceState) {
  fillThemeBackground(ctx, w, h, 'force')
  const cx = w * 0.5
  const fulcrumY = h * 0.62
  const pxPerM = Math.min(w * 0.18, 110)
  const half = (PLANK_LENGTH / 2) * pxPerM

  // Fulcrum
  ctx.fillStyle = '#78716c'
  ctx.beginPath()
  ctx.moveTo(cx, fulcrumY)
  ctx.lineTo(cx - 28, fulcrumY + 48)
  ctx.lineTo(cx + 28, fulcrumY + 48)
  ctx.closePath()
  ctx.fill()

  ctx.save()
  ctx.translate(cx, fulcrumY)
  ctx.rotate(-state.tilt)

  // Plank
  ctx.fillStyle = '#a8a29e'
  ctx.fillRect(-half, -8, half * 2, 16)
  ctx.strokeStyle = '#57534e'
  ctx.lineWidth = 1
  ctx.strokeRect(-half, -8, half * 2, 16)

  // Tick marks every 0.25 m
  for (let d = -2; d <= 2; d += 0.25) {
    const x = d * pxPerM
    ctx.strokeStyle = d === 0 ? '#fbbf24' : 'rgba(28,25,23,0.45)'
    ctx.beginPath()
    ctx.moveTo(x, -8)
    ctx.lineTo(x, d % 1 === 0 ? 10 : 4)
    ctx.stroke()
  }

  const drawMass = (dist: number, mass: number, side: 'left' | 'right') => {
    const x = side === 'left' ? -dist * pxPerM : dist * pxPerM
    const size = 18 + Math.sqrt(mass) * 3.2
    ctx.fillStyle = side === 'left' ? '#f97316' : '#38bdf8'
    ctx.fillRect(x - size / 2, -8 - size, size, size)
    ctx.fillStyle = '#0f172a'
    ctx.font = '600 11px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${mass} kg`, x, -8 - size - 6)
  }

  drawMass(state.leftDist, state.leftMass, 'left')
  drawMass(state.rightDist, state.rightMass, 'right')

  ctx.restore()

  const tau = netTorque(state)
  ctx.fillStyle = 'rgba(15,23,42,0.85)'
  ctx.fillRect(16, 16, 260, 52)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 13px Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(
    isBalanced(state) ? 'Balanced ✓' : tau > 0 ? 'Tips left' : 'Tips right',
    28,
    38,
  )
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px Roboto, sans-serif'
  ctx.fillText(`Net m·d = ${tau.toFixed(2)} kg·m`, 28, 56)
}

export function BalancingActSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<BalanceState>(defaultBalanceState())
  const [running, setRunning] = useState(true)
  const [ui, setUi] = useState(() => defaultBalanceState())
  const [status, setStatus] = useState('Adjust masses and distances')

  // Keep distances/masses from UI synced into physics state
  stateRef.current = {
    ...stateRef.current,
    leftMass: ui.leftMass,
    leftDist: ui.leftDist,
    rightMass: ui.rightMass,
    rightDist: ui.rightDist,
  }

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepBalance(s, dt),
    draw,
    onSync: (s) => {
      setStatus(
        isBalanced(s)
          ? 'Balanced — torques cancel'
          : `Tilt ${(s.tilt * (180 / Math.PI)).toFixed(1)}° · τ∝ ${netTorque(s).toFixed(2)}`,
      )
    },
  })

  const patch = (p: Partial<BalanceState>) => {
    setUi((u) => {
      const next = { ...u, ...p }
      if (p.leftDist !== undefined) next.leftDist = snapDistance(p.leftDist)
      if (p.rightDist !== undefined) next.rightDist = snapDistance(p.rightDist)
      return next
    })
  }

  const dragStartRef = useRef<{ mass: number; y: number } | null>(null)

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const s = stateRef.current
      const cx = size.w * 0.5
      const fulcrumY = size.h * 0.62
      const pxPerM = Math.min(size.w * 0.18, 110)
      const t = s.tilt
      const cos = Math.cos(t)
      const sin = Math.sin(t)
      const dx = pt.x - cx
      const dy = pt.y - fulcrumY
      const lx = dx * cos - dy * sin
      const ly = dx * sin + dy * cos
      const leftX = -s.leftDist * pxPerM
      const rightX = s.rightDist * pxPerM
      const leftSize = 18 + Math.sqrt(s.leftMass) * 3.2
      const rightSize = 18 + Math.sqrt(s.rightMass) * 3.2
      if (Math.abs(lx - leftX) < leftSize * 0.75 && ly > -8 - leftSize - 12 && ly < 16) return 'left'
      if (Math.abs(lx - rightX) < rightSize * 0.75 && ly > -8 - rightSize - 12 && ly < 16) return 'right'
      return null
    },
    onDragStart: (id, pt) => {
      const s = stateRef.current
      dragStartRef.current = {
        mass: id === 'left' ? s.leftMass : s.rightMass,
        y: pt.y,
      }
    },
    onDrag: (id, pt, size) => {
      const s = stateRef.current
      const cx = size.w * 0.5
      const fulcrumY = size.h * 0.62
      const pxPerM = Math.min(size.w * 0.18, 110)
      const t = s.tilt
      const cos = Math.cos(t)
      const sin = Math.sin(t)
      const dx = pt.x - cx
      const dy = pt.y - fulcrumY
      const lx = dx * cos - dy * sin
      const dist = clamp(Math.abs(lx) / pxPerM, 0.25, 2)
      const start = dragStartRef.current
      const massDelta = start ? (start.y - pt.y) / 4 : 0
      const mass = clamp(Math.round(((start?.mass ?? 10) + massDelta) * 2) / 2, 1, 50)
      if (id === 'left') patch({ leftDist: dist, leftMass: mass })
      else patch({ rightDist: dist, rightMass: mass })
    },
    onDragEnd: () => {
      dragStartRef.current = null
    },
  })

  const reset = () => {
    const d = defaultBalanceState()
    setUi(d)
    stateRef.current = d
  }

  const sidebar = (
    <>
      <h3>Left side</h3>
      <div className="sim-slider-row">
        <label>
          <span>Mass</span>
          <span>{ui.leftMass} kg</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={0.5}
          value={ui.leftMass}
          onChange={(e) => patch({ leftMass: Number(e.target.value) })}
        />
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Distance</span>
          <span>{ui.leftDist.toFixed(2)} m</span>
        </label>
        <input
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={ui.leftDist}
          onChange={(e) => patch({ leftDist: Number(e.target.value) })}
        />
      </div>
      <h3>Right side</h3>
      <div className="sim-slider-row">
        <label>
          <span>Mass</span>
          <span>{ui.rightMass} kg</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={0.5}
          value={ui.rightMass}
          onChange={(e) => patch({ rightMass: Number(e.target.value) })}
        />
      </div>
      <label className="sim-label">
        Mystery mass (PhET)
        <select
          className="sim-select"
          value={ui.rightMass}
          onChange={(e) => patch({ rightMass: Number(e.target.value) })}
        >
          {MYSTERY_MASSES.map((m) => (
            <option key={m} value={m}>
              {m} kg
            </option>
          ))}
        </select>
      </label>
      <div className="sim-slider-row">
        <label>
          <span>Distance</span>
          <span>{ui.rightDist.toFixed(2)} m</span>
        </label>
        <input
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={ui.rightDist}
          onChange={(e) => patch({ rightDist: Number(e.target.value) })}
        />
      </div>
      <p className="sim-readout">{status}</p>
      <p className="sim-hint" style={{ color: '#64748b', fontSize: 12 }}>
        Plank {PLANK_LENGTH} m · snap {0.25} m (PhET Plank.ts)
      </p>
    </>
  )

  return (
    <SimShell
      title="Balancing Act"
      subtitle="Torque balance on a teeter-totter — PhET plank geometry"
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
