import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlStat,
  ControlStats,
  ControlToggle,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect, withShadow } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  createMassConservationState,
  displayedMass,
  resetMassConservation,
  stepMassConservation,
  TOTAL_MASS,
} from './conservationOfMassModel'

type Layout = {
  flask: { x: number; y: number; w: number; h: number }
}

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
  withShadow(ctx, () => {
    ctx.fillRect(cx - panW / 2, cy, panW, panH)
  })
  ctx.strokeRect(cx - panW / 2, cy, panW, panH)

  if (side === 'left') {
    roundRect(ctx, cx - 28, cy - 36 - progress * 10, 56, 32, 6)
    ctx.fillStyle = `rgba(52,152,219,${0.5 + progress * 0.3})`
    ctx.fill()
    ctx.strokeStyle = '#2980b9'
    ctx.lineWidth = 2
    ctx.stroke()
    drawLabelPill(ctx, 'Reactants', cx, cy - 48 - progress * 10, {
      fontSize: Math.max(10, fs - 2),
      bold: false,
    })
  } else {
    roundRect(ctx, cx - 28, cy - 36, 56, 32, 6)
    ctx.fillStyle = `rgba(39,174,96,${0.35 + progress * 0.55})`
    ctx.fill()
    ctx.strokeStyle = '#27ae60'
    ctx.lineWidth = 2
    ctx.stroke()
    drawLabelPill(ctx, 'Products', cx, cy - 48, { fontSize: Math.max(10, fs - 2), bold: false })
  }

  drawValueChip(ctx, 'mass', `${mass.toFixed(1)} g`, cx, cy + 28, { fontSize: fs })
  drawValueChip(ctx, '', label, cx, cy + 48, { fontSize: Math.max(10, fs - 2) })
}

export function ConservationOfMassSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createMassConservationState())
  const paramsRef = useRef({ sealed: true })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [sealed, setSealed] = useState(true)
  const [version, setVersion] = useState(0)
  const [progress, setProgress] = useState(0)

  paramsRef.current.sealed = sealed

  useEffect(() => {
    const id = window.setInterval(() => setProgress(stateRef.current.progress), 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    cursorForHit: () => 'pointer',
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      const f = L.flask
      if (pt.x >= f.x && pt.x <= f.x + f.w && pt.y >= f.y && pt.y <= f.y + f.h) return 'flask'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (id !== 'flask') return
      hintShown.current = false
      paramsRef.current.sealed = !paramsRef.current.sealed
      setSealed(paramsRef.current.sealed)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepMassConservation(stateRef.current, dt, running)
      const s = stateRef.current
      const isSealed = paramsRef.current.sealed
      const mass = displayedMass(s.progress, isSealed)
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)

      clearThemedScene(ctx, w, h, 'lab')

      drawLabelPill(ctx, 'Conservation of Mass', w / 2, 28, { fontSize: fs + 2 })
      drawValueChip(
        ctx,
        '',
        isSealed ? 'Sealed system — total mass stays constant' : 'Open system — gas escapes',
        w / 2,
        28 + fs + 12,
        { fontSize: fs },
      )

      const flaskX = w * 0.5
      const flaskY = h * 0.38
      const flaskW = w * 0.22
      const flaskH = h * 0.28

      layoutRef.current = {
        flask: {
          x: flaskX - flaskW * 0.4,
          y: flaskY - 10,
          w: flaskW * 0.8,
          h: flaskH + 20,
        },
      }

      drawHoverHalo(ctx, flaskX, flaskY + flaskH / 2, flaskW * 0.45, hover === 'flask')

      withShadow(ctx, () => {
        ctx.strokeStyle = hover === 'flask' ? '#2980b9' : '#5dade2'
        ctx.lineWidth = hover === 'flask' ? 5 : 4
        ctx.beginPath()
        ctx.moveTo(flaskX - flaskW * 0.2, flaskY)
        ctx.lineTo(flaskX - flaskW * 0.35, flaskY + flaskH * 0.15)
        ctx.lineTo(flaskX - flaskW * 0.35, flaskY + flaskH)
        ctx.lineTo(flaskX + flaskW * 0.35, flaskY + flaskH)
        ctx.lineTo(flaskX + flaskW * 0.35, flaskY + flaskH * 0.15)
        ctx.lineTo(flaskX + flaskW * 0.2, flaskY)
        ctx.stroke()

        const mix = s.progress
        ctx.fillStyle = `rgba(${Math.round(52 + mix * 40)}, ${Math.round(152 - mix * 80)}, ${Math.round(219 - mix * 100)}, 0.65)`
        ctx.fillRect(flaskX - flaskW * 0.32, flaskY + flaskH * (1 - 0.55 - mix * 0.1), flaskW * 0.64, flaskH * 0.55)
      })

      if (isSealed) {
        ctx.beginPath()
        ctx.moveTo(flaskX - flaskW * 0.2, flaskY)
        ctx.lineTo(flaskX + flaskW * 0.2, flaskY)
        ctx.strokeStyle = '#e67e22'
        ctx.lineWidth = 5
        ctx.stroke()
        drawValueChip(ctx, '', 'STOPPER — click to open', flaskX, flaskY - 14, {
          fontSize: Math.max(10, fs - 2),
          accent: true,
        })
      } else {
        drawValueChip(ctx, '', 'OPEN — click to seal', flaskX, flaskY - 14, { fontSize: Math.max(10, fs - 2) })
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

      drawValueChip(ctx, 'Reaction', `${Math.round(s.progress * 100)}%`, flaskX, flaskY + flaskH + fs + 12, {
        fontSize: fs,
      })

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

      const tilt = isSealed ? 0 : Math.min(0.08, s.progress * 0.08)
      drawBalancePan(ctx, w * 0.32, beamY + 8 + tilt * 40, mass, 'Before / during', 1 - s.progress, 'left', fs)
      drawBalancePan(ctx, w * 0.68, beamY + 8 - tilt * 40, mass, 'After', s.progress, 'right', fs)

      drawLabelPill(ctx, `Total mass: ${mass.toFixed(1)} g`, w / 2, h * 0.86 + 18, {
        fontSize: fs,
        bg: isSealed ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.15)',
        fg: isSealed ? '#1e8449' : '#922b21',
      })

      if (hintShown.current) {
        drawHint(ctx, 'click flask to open / seal', w / 2, h - 18, w, h)
      }
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
        paramsRef.current.sealed = true
        setSealed(true)
        setRunning(true)
        hintShown.current = true
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
                paramsRef.current.sealed = v
                setSealed(v)
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
