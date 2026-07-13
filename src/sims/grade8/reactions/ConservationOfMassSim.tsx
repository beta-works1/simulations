import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlStat,
  ControlStats,
  ControlToggle,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  createMassConservationState,
  displayedMass,
  resetMassConservation,
  stepMassConservation,
  TOTAL_MASS,
} from './conservationOfMassModel'

function drawBalancePan(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  mass: number,
  label: string,
  progress: number,
  side: 'left' | 'right',
  fs: number,
) {
  const panW = 80
  const panH = 8
  ctx.strokeStyle = '#566573'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx, cy - 40)
  ctx.lineTo(cx, cy)
  ctx.stroke()

  ctx.fillStyle = '#bdc3c7'
  ctx.fillRect(cx - panW / 2, cy, panW, panH)
  ctx.strokeRect(cx - panW / 2, cy, panW, panH)

  if (side === 'left') {
    roundRect(ctx, cx - 28, cy - 36 - progress * 10, 56, 32, 6)
    ctx.fillStyle = `rgba(52,152,219,${0.5 + progress * 0.3})`
    ctx.fill()
    ctx.strokeStyle = '#2980b9'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#1a252f'
    ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('Reactants', cx, cy - 48 - progress * 10)
  } else {
    roundRect(ctx, cx - 28, cy - 36, 56, 32, 6)
    ctx.fillStyle = `rgba(39,174,96,${0.35 + progress * 0.55})`
    ctx.fill()
    ctx.strokeStyle = '#27ae60'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#1a252f'
    ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('Products', cx, cy - 48)
  }

  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.fillText(`${mass.toFixed(1)} g`, cx, cy + 28)
  ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
  ctx.fillStyle = '#5d6d7e'
  ctx.fillText(label, cx, cy + 44)
}

export function ConservationOfMassSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createMassConservationState())
  const [running, setRunning] = useState(true)
  const [sealed, setSealed] = useState(true)
  const [version, setVersion] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setProgress(stateRef.current.progress), 120)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepMassConservation(stateRef.current, dt, running)
      const s = stateRef.current
      const mass = displayedMass(s.progress, sealed)
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Conservation of Mass', w / 2, 28)
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText(
        sealed ? 'Sealed system — total mass stays constant' : 'Open system — gas escapes, mass appears to drop',
        w / 2,
        28 + fs + 8,
      )

      const flaskX = w * 0.5
      const flaskY = h * 0.38
      const flaskW = w * 0.22
      const flaskH = h * 0.28

      ctx.strokeStyle = '#5dade2'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(flaskX - flaskW * 0.2, flaskY)
      ctx.lineTo(flaskX - flaskW * 0.35, flaskY + flaskH * 0.15)
      ctx.lineTo(flaskX - flaskW * 0.35, flaskY + flaskH)
      ctx.lineTo(flaskX + flaskW * 0.35, flaskY + flaskH)
      ctx.lineTo(flaskX + flaskW * 0.35, flaskY + flaskH * 0.15)
      ctx.lineTo(flaskX + flaskW * 0.2, flaskY)
      ctx.stroke()

      if (sealed) {
        ctx.beginPath()
        ctx.moveTo(flaskX - flaskW * 0.2, flaskY)
        ctx.lineTo(flaskX + flaskW * 0.2, flaskY)
        ctx.strokeStyle = '#e67e22'
        ctx.lineWidth = 5
        ctx.stroke()
        ctx.fillStyle = '#e67e22'
        ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
        ctx.fillText('STOPPER', flaskX, flaskY - 10)
      } else {
        ctx.fillStyle = '#5d6d7e'
        ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
        ctx.fillText('OPEN', flaskX, flaskY - 10)
        if (running && s.progress > 0.2) {
          for (let i = 0; i < 5; i++) {
            const t = (s.time * 0.8 + i * 0.3) % 1
            ctx.beginPath()
            ctx.arc(flaskX - 10 + i * 5, flaskY - t * 40, 4, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(149,165,166,0.7)'
            ctx.fill()
          }
        }
      }

      const mix = s.progress
      ctx.fillStyle = `rgba(${Math.round(52 + mix * 40)}, ${Math.round(152 - mix * 80)}, ${Math.round(219 - mix * 100)}, 0.65)`
      ctx.fillRect(flaskX - flaskW * 0.32, flaskY + flaskH * (1 - 0.55 - mix * 0.1), flaskW * 0.64, flaskH * 0.55)

      ctx.fillStyle = '#1a252f'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillText(`Reaction: ${Math.round(s.progress * 100)}%`, flaskX, flaskY + flaskH + fs + 12)

      const beamY = h * 0.72
      ctx.strokeStyle = '#566573'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(w * 0.15, beamY)
      ctx.lineTo(w * 0.85, beamY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(w * 0.5, beamY - 30)
      ctx.lineTo(w * 0.5, beamY)
      ctx.stroke()

      const tilt = sealed ? 0 : Math.min(0.08, s.progress * 0.08)
      drawBalancePan(ctx, w * 0.32, beamY + 8 + tilt * 40, mass, 'Before / during', 1 - s.progress, 'left', fs)
      drawBalancePan(ctx, w * 0.68, beamY + 8 - tilt * 40, mass, 'After', s.progress, 'right', fs)

      roundRect(ctx, w * 0.34, h * 0.86, w * 0.32, 36, 8)
      ctx.fillStyle = sealed ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.15)'
      ctx.fill()
      ctx.strokeStyle = sealed ? '#27ae60' : '#e74c3c'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.fillText(`Total mass: ${mass.toFixed(1)} g`, w / 2, h * 0.86 + 22)
    },
    [running, sealed],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  const mass = displayedMass(progress, sealed)

  return (
    <SimShell
      title="Conservation of Mass"
      subtitle="Mass is conserved in a closed system"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = resetMassConservation()
        setSealed(true)
        setRunning(true)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="System">
            <ControlHint>
              Play advances the reaction. In a sealed flask, mass stays at {TOTAL_MASS.toFixed(1)} g.
            </ControlHint>
            <ControlToggle
              label="Sealed container"
              checked={sealed}
              onChange={(v) => {
                setSealed(v)
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
          <ControlSection title="Mass readout">
            <ControlStats>
              <ControlStat label="Displayed mass" value={`${mass.toFixed(1)} g`} />
              <ControlStat label="Progress" value={`${Math.round(progress * 100)}%`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
