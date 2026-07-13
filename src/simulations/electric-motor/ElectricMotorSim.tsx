import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import { DEFAULT_MOTOR_STATE, motorSpeed, resetMotor, type MotorState } from './model'

export function ElectricMotorSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<MotorState>(DEFAULT_MOTOR_STATE)
  const angleRef = useRef(0)

  useAnimationLoop(state.running && state.current > 0, (dt) => {
    angleRef.current += motorSpeed(state.current) * dt
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, w, h)

    const cx = w * 0.5
    const cy = h * 0.52
    const angle = angleRef.current

    // Horseshoe magnets
    const magnetW = Math.min(w * 0.12, 70)
    const magnetH = Math.min(h * 0.38, 180)
    const gap = Math.min(w * 0.18, 110)

    // Left magnet (N)
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(cx - gap - magnetW, cy - magnetH / 2, magnetW, magnetH / 2)
    ctx.fillStyle = '#1e40af'
    ctx.fillRect(cx - gap - magnetW, cy, magnetW, magnetH / 2)
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 13px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx - gap - magnetW / 2, cy - magnetH / 4 + 5)
    ctx.fillText('S', cx - gap - magnetW / 2, cy + magnetH / 4 + 5)

    // Right magnet (S/N flipped)
    ctx.fillStyle = '#1e40af'
    ctx.fillRect(cx + gap, cy - magnetH / 2, magnetW, magnetH / 2)
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(cx + gap, cy, magnetW, magnetH / 2)
    ctx.fillText('S', cx + gap + magnetW / 2, cy - magnetH / 4 + 5)
    ctx.fillText('N', cx + gap + magnetW / 2, cy + magnetH / 4 + 5)

    // Field lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'
    ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      const y = cy + i * 28
      ctx.beginPath()
      ctx.moveTo(cx - gap - magnetW + 8, y)
      ctx.bezierCurveTo(cx - gap / 2, y - 12, cx + gap / 2, y + 12, cx + gap + magnetW - 8, y)
      ctx.stroke()
    }

    // Rotating coil
    const coilR = Math.min(gap * 0.55, 48)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    ctx.strokeStyle = state.current > 0 ? '#fbbf24' : '#64748b'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(0, 0, coilR, coilR * 0.55, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Coil windings
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * coilR * 0.7, Math.sin(a) * coilR * 0.4)
      ctx.lineTo(Math.cos(a + 0.3) * coilR * 0.85, Math.sin(a + 0.3) * coilR * 0.48)
      ctx.stroke()
    }

    // Commutator
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(-6, -coilR * 0.55 - 10, 12, 8)
    ctx.restore()

    // Shaft
    ctx.fillStyle = '#cbd5e1'
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()

    // Current arrows when powered
    if (state.current > 0 && state.running) {
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - gap + 20, cy + magnetH / 2 + 30)
      ctx.lineTo(cx + gap - 20, cy + magnetH / 2 + 30)
      ctx.stroke()
      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.moveTo(cx + gap - 20, cy + magnetH / 2 + 30)
      ctx.lineTo(cx + gap - 32, cy + magnetH / 2 + 24)
      ctx.lineTo(cx + gap - 32, cy + magnetH / 2 + 36)
      ctx.closePath()
      ctx.fill()
      ctx.font = '11px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Current', cx, cy + magnetH / 2 + 48)
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Electric motor — current → magnetic force → spin', 16, 24)

    const rpm = Math.round((motorSpeed(state.current) * 60) / (2 * Math.PI))
    ctx.textAlign = 'right'
    ctx.fillText(state.running && state.current > 0 ? `~${rpm} RPM` : 'Stopped', w - 16, 24)
  }, [w, h, state])

  useEffect(() => {
    draw()
    if (!state.running) return
    let raf = 0
    const tick = () => {
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draw, state.running])

  const reset = () => {
    setState(resetMotor())
    angleRef.current = 0
  }

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Motor</h3>
          <p className="sim-hint">
            Current through a coil in a magnetic field produces a turning force (torque).
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Current (A)</span>
              <span>{state.current.toFixed(2)} A</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.current}
              onChange={(e) => setState((s) => ({ ...s, current: Number(e.target.value) }))}
            />
          </div>
          <p className="sim-readout">
            <strong>Speed ∝ current</strong>
            <br />
            Higher current → faster rotation
            <br />
            {state.current <= 0 ? 'No current — motor idle' : 'Motor spinning'}
          </p>
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
