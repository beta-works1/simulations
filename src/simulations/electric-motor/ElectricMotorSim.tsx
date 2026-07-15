import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, fillThemeBackground, SCENE, strokeWithGlow, withShadow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import { DEFAULT_MOTOR_STATE, motorSpeed, resetMotor } from './model'

export function ElectricMotorSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const paramsRef = useRef({ current: DEFAULT_MOTOR_STATE.current, running: true })
  const angleRef = useRef(0)
  const [running, setRunning] = useState(true)
  const [current, setCurrent] = useState(DEFAULT_MOTOR_STATE.current)
  const [version, setVersion] = useState(0)

  paramsRef.current.running = running

  useAnimationLoop(running && paramsRef.current.current > 0, (dt) => {
    angleRef.current += motorSpeed(paramsRef.current.current) * dt
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrent(paramsRef.current.current)
    }, 120)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cur = paramsRef.current.current
    const isRunning = paramsRef.current.running

    fillThemeBackground(ctx, w, h, 'electric')

    const cx = w * 0.5
    const cy = h * 0.52
    const angle = angleRef.current

    const magnetW = Math.min(w * 0.12, 70)
    const magnetH = Math.min(h * 0.38, 180)
    const gap = Math.min(w * 0.18, 110)

    withShadow(ctx, () => {
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(cx - gap - magnetW, cy - magnetH / 2, magnetW, magnetH / 2)
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(cx - gap - magnetW, cy, magnetW, magnetH / 2)
    }, { blur: 14, oy: 4 })

    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 13px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx - gap - magnetW / 2, cy - magnetH / 4 + 5)
    ctx.fillText('S', cx - gap - magnetW / 2, cy + magnetH / 4 + 5)

    withShadow(ctx, () => {
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(cx + gap, cy - magnetH / 2, magnetW, magnetH / 2)
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(cx + gap, cy, magnetW, magnetH / 2)
    }, { blur: 14, oy: 4 })
    ctx.fillText('S', cx + gap + magnetW / 2, cy - magnetH / 4 + 5)
    ctx.fillText('N', cx + gap + magnetW / 2, cy + magnetH / 4 + 5)

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'
    ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      const y = cy + i * 28
      ctx.beginPath()
      ctx.moveTo(cx - gap - magnetW + 8, y)
      ctx.bezierCurveTo(cx - gap / 2, y - 12, cx + gap / 2, y + 12, cx + gap + magnetW - 8, y)
      ctx.stroke()
    }

    const coilR = Math.min(gap * 0.55, 48)
    const coilActive = cur > 0
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    if (coilActive) {
      drawGlow(ctx, 0, 0, coilR * 1.4, SCENE.electric.accent, 0.25)
    }

    withShadow(ctx, () => {
      const coilColor = coilActive ? SCENE.electric.accent : '#64748b'
      if (coilActive) {
        strokeWithGlow(
          ctx,
          () => {
            ctx.beginPath()
            ctx.ellipse(0, 0, coilR, coilR * 0.55, 0, 0, Math.PI * 2)
          },
          coilColor,
          3,
          SCENE.electric.glow,
        )
      } else {
        ctx.strokeStyle = coilColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(0, 0, coilR, coilR * 0.55, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.strokeStyle = coilActive ? SCENE.electric.hot : '#64748b'
      ctx.lineWidth = coilActive ? 2.5 : 2
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * coilR * 0.7, Math.sin(a) * coilR * 0.4)
        ctx.lineTo(Math.cos(a + 0.3) * coilR * 0.85, Math.sin(a + 0.3) * coilR * 0.48)
        ctx.stroke()
      }
    }, { blur: 10, oy: 2 })

    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(-6, -coilR * 0.55 - 10, 12, 8)
    ctx.restore()

    ctx.fillStyle = '#cbd5e1'
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()

    if (cur > 0 && isRunning) {
      strokeWithGlow(
        ctx,
        () => {
          ctx.beginPath()
          ctx.moveTo(cx - gap + 20, cy + magnetH / 2 + 30)
          ctx.lineTo(cx + gap - 20, cy + magnetH / 2 + 30)
        },
        SCENE.electric.accent,
        2,
        SCENE.electric.glow,
      )
      ctx.fillStyle = SCENE.electric.accent
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

    // Vertical current dial
    const dialX = w - 36
    const dialTop = h * 0.22
    const dialH = h * 0.5
    const dialY = dialTop + (1 - cur) * dialH
    ctx.fillStyle = 'rgba(15,23,42,0.55)'
    ctx.fillRect(dialX - 8, dialTop, 16, dialH)
    ctx.fillStyle = SCENE.electric.accent
    ctx.fillRect(dialX - 8, dialY, 16, dialTop + dialH - dialY)
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.arc(dialX, dialY, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('I', dialX, dialTop - 10)

    ctx.fillStyle = '#64748b'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Electric motor — current → magnetic force → spin', 16, 24)

    const rpm = Math.round((motorSpeed(cur) * 60) / (2 * Math.PI))
    ctx.textAlign = 'right'
    ctx.fillText(isRunning && cur > 0 ? `~${rpm} RPM` : 'Stopped', w - 56, 24)
  }, [w, h, version])

  useEffect(() => {
    draw()
    let raf = 0
    const tick = () => {
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draw])

  const setCurrentValue = (v: number) => {
    const next = Math.round(clamp(v, 0, 1) * 20) / 20
    paramsRef.current.current = next
    setCurrent(next)
    setVersion((n) => n + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const dialX = size.w - 36
      const dialTop = size.h * 0.22
      const dialH = size.h * 0.5
      if (pt.x >= dialX - 24 && pt.x <= dialX + 24 && pt.y >= dialTop - 8 && pt.y <= dialTop + dialH + 8) {
        return 'current'
      }
      // Also allow vertical drag across the coil region
      if (pt.x > size.w * 0.25 && pt.x < size.w * 0.75) return 'current'
      return null
    },
    onDrag: (_id, pt, size) => {
      const dialTop = size.h * 0.22
      const dialH = size.h * 0.5
      const t = 1 - clamp((pt.y - dialTop) / Math.max(1, dialH), 0, 1)
      setCurrentValue(t)
    },
  })

  const reset = () => {
    const next = resetMotor()
    paramsRef.current = { current: next.current, running: true }
    setCurrent(next.current)
    setRunning(true)
    angleRef.current = 0
    setVersion((n) => n + 1)
  }

  return (
    <SimShell
      title="Electric Motor"
      subtitle="See how current in a magnetic field produces continuous rotation."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Motor</h3>
          <p className="sim-hint">
            Current through a coil in a magnetic field produces a turning force (torque). Drag
            vertically on the canvas or dial to set current.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Current (A)</span>
              <span>{current.toFixed(2)} A</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={current}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
            />
          </div>
          <p className="sim-readout">
            <strong>Speed ∝ current</strong>
            <br />
            Higher current → faster rotation
            <br />
            {current <= 0 ? 'No current — motor idle' : 'Motor spinning'}
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => {
            setRunning((r) => {
              paramsRef.current.running = !r
              return !r
            })
          }}
          onReset={reset}
        />
      }
    />
  )
}
