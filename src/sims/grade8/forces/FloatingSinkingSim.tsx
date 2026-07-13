import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, withShadow } from '../../shared/drawHelpers'
import { drawFaintGrid } from '../../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

export interface FloatState {
  y: number
  velocity: number
  time: number
}

export function createFloatState(): FloatState {
  return { y: 0.5, velocity: 0, time: 0 }
}

export type FloatVerdict = 'float' | 'suspend' | 'sink'

export function floatVerdict(objectDensity: number, fluidDensity: number): FloatVerdict {
  const diff = objectDensity - fluidDensity
  if (Math.abs(diff) < 0.05) return 'suspend'
  return diff < 0 ? 'float' : 'sink'
}

/** Simple density model — unchanged. */
export function stepFloat(
  s: FloatState,
  dt: number,
  objectDensity: number,
  fluidDensity: number,
): FloatState {
  const verdict = floatVerdict(objectDensity, fluidDensity)
  const targetY = verdict === 'float' ? 0.22 : verdict === 'sink' ? 0.88 : 0.55
  const buoyancy = (fluidDensity - objectDensity) * 0.08
  let { y, velocity } = s
  velocity += buoyancy * dt
  velocity += (targetY - y) * 2.2 * dt
  velocity *= 0.94
  y += velocity * dt
  y = Math.max(0.15, Math.min(0.92, y))
  return { ...s, y, velocity, time: s.time + dt }
}

type Layout = {
  densityBar: { x: number; y: number; w: number; h: number }
  knobjX: number
  obj: { x: number; y: number; r: number }
  fluidBar: { x: number; y: number; w: number; h: number; knobjX: number }
}

export function FloatingSinkingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createFloatState())
  const paramsRef = useRef({ objectDensity: 0.8, objectVolume: 50, fluidDensity: 1.0 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [objectDensity, setObjectDensity] = useState(0.8)
  const [objectVolume, setObjectVolume] = useState(50)
  const [fluidDensity, setFluidDensity] = useState(1.0)
  const [version, setVersion] = useState(0)
  const [verdict, setVerdict] = useState<FloatVerdict>('float')

  paramsRef.current.objectDensity = objectDensity
  paramsRef.current.objectVolume = objectVolume
  paramsRef.current.fluidDensity = fluidDensity

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = paramsRef.current
      setObjectDensity(Math.round(p.objectDensity * 100) / 100)
      setFluidDensity(Math.round(p.fluidDensity * 10) / 10)
      setObjectVolume(Math.round(p.objectVolume))
      setVerdict(floatVerdict(p.objectDensity, p.fluidDensity))
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.obj.x, pt.y - L.obj.y) < L.obj.r + 12) return 'object'
      if (
        pt.x >= L.densityBar.x &&
        pt.x <= L.densityBar.x + L.densityBar.w &&
        pt.y >= L.densityBar.y - 12 &&
        pt.y <= L.densityBar.y + L.densityBar.h + 12
      )
        return 'objDensity'
      if (
        pt.x >= L.fluidBar.x &&
        pt.x <= L.fluidBar.x + L.fluidBar.w &&
        pt.y >= L.fluidBar.y - 12 &&
        pt.y <= L.fluidBar.y + L.fluidBar.h + 12
      )
        return 'fluidDensity'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      hintShown.current = false
      const L = layoutRef.current
      const p = paramsRef.current
      if (!L) return
      if (id === 'objDensity') {
        const t = clamp((pt.x - L.densityBar.x) / L.densityBar.w, 0, 1)
        p.objectDensity = 0.2 + t * 2.3
      } else if (id === 'object') {
        const canvasH = canvasRef.current?.parentElement?.clientHeight ?? 400
        const t = clamp(pt.y / canvasH, 0.15, 0.9)
        p.objectDensity = 0.2 + t * 2.3
      } else if (id === 'fluidDensity') {
        const t = clamp((pt.x - L.fluidBar.x) / L.fluidBar.w, 0, 1)
        p.fluidDensity = 0.5 + t * 13.1
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const { objectDensity: od, objectVolume: ov, fluidDensity: fd } = paramsRef.current
      if (dt > 0 && running) stateRef.current = stepFloat(stateRef.current, dt, od, fd)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const v = floatVerdict(od, fd)
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'force')
      drawFaintGrid(ctx, w, h)

      const tankL = w * 0.22
      const tankR = w * 0.78
      const tankT = h * 0.18
      const tankB = h * 0.72
      const waterTop = h * 0.3

      ctx.strokeStyle = '#5d6d7e'
      ctx.lineWidth = 3
      ctx.strokeRect(tankL, tankT, tankR - tankL, tankB - tankT)

      ctx.fillStyle = 'rgba(52,152,219,0.45)'
      ctx.fillRect(tankL + 3, waterTop, tankR - tankL - 6, tankB - waterTop - 3)
      drawLabelPill(ctx, 'fluid', tankL + 28, waterTop + 16, { fontSize: Math.max(9, fs - 2) })

      const size = Math.sqrt(ov / 50) * Math.min(w, h) * 0.07
      const ox = (tankL + tankR) / 2
      const oy = tankT + s.y * (tankB - tankT)
      drawHoverHalo(ctx, ox, oy, size + 8, hover === 'object')
      withShadow(ctx, () => {
        ctx.fillStyle = od < fd ? '#f5b041' : od > fd ? '#7f8c8d' : '#abebc6'
        ctx.beginPath()
        ctx.arc(ox, oy, size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.strokeStyle = hover === 'object' ? '#2980b9' : '#2c3e50'
      ctx.lineWidth = hover === 'object' ? 3 : 2
      ctx.stroke()
      drawValueChip(ctx, 'ρ', `${od.toFixed(2)}`, ox, oy - size - 14, { fontSize: Math.max(10, fs - 1) })

      // Density tracks
      const barY = h * 0.82
      const barW = w * 0.34
      const objBarX = w * 0.08
      const fluBarX = w * 0.58
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(objBarX, barY, barW, 10)
      ctx.fillRect(fluBarX, barY, barW, 10)
      const objT = (od - 0.2) / 2.3
      const fluT = (fd - 0.5) / 13.1
      drawHoverHalo(ctx, objBarX + objT * barW, barY + 5, 14, hover === 'objDensity')
      drawHoverHalo(ctx, fluBarX + fluT * barW, barY + 5, 14, hover === 'fluidDensity')
      ctx.fillStyle = '#f39c12'
      ctx.beginPath()
      ctx.arc(objBarX + objT * barW, barY + 5, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3498db'
      ctx.beginPath()
      ctx.arc(fluBarX + fluT * barW, barY + 5, 8, 0, Math.PI * 2)
      ctx.fill()
      drawValueChip(ctx, 'object ρ', `${od.toFixed(2)}`, objBarX + barW / 2, barY - 14, {
        fontSize: Math.max(9, fs - 2),
      })
      drawValueChip(ctx, 'fluid ρ', `${fd.toFixed(1)}`, fluBarX + barW / 2, barY - 14, {
        fontSize: Math.max(9, fs - 2),
      })

      layoutRef.current = {
        densityBar: { x: objBarX, y: barY, w: barW, h: 10 },
        knobjX: objBarX + objT * barW,
        obj: { x: ox, y: oy, r: size },
        fluidBar: {
          x: fluBarX,
          y: barY,
          w: barW,
          h: 10,
          knobjX: fluBarX + fluT * barW,
        },
      }

      const verdictText =
        v === 'float' ? 'Floats' : v === 'sink' ? 'Sinks' : 'Suspends (neutral buoyancy)'
      drawLabelPill(ctx, verdictText, w / 2, h * 0.1, {
        fontSize: fs + 1,
        bg: v === 'float' ? 'rgba(39,174,96,0.2)' : v === 'sink' ? 'rgba(192,57,43,0.2)' : 'rgba(142,68,173,0.2)',
      })
      if (hintShown.current) drawHint(ctx, 'drag object or density sliders on canvas', w / 2, h - 12, w, h)
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Floating & Sinking"
      subtitle="Compare object density to fluid density"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createFloatState()
        paramsRef.current = { objectDensity: 0.8, objectVolume: 50, fluidDensity: 1.0 }
        setObjectDensity(0.8)
        setObjectVolume(50)
        setFluidDensity(1.0)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Object">
            <ControlHint>Drag the orange density handle or the floating object.</ControlHint>
            <ControlSlider
              label="Object density"
              value={objectDensity}
              min={0.2}
              max={2.5}
              step={0.05}
              display={`${objectDensity.toFixed(2)} g/cm³`}
              onChange={(v) => {
                setObjectDensity(v)
                paramsRef.current.objectDensity = v
              }}
            />
            <ControlSlider
              label="Object volume (size)"
              value={objectVolume}
              min={20}
              max={100}
              step={5}
              display={`${objectVolume} cm³`}
              onChange={(v) => {
                setObjectVolume(v)
                paramsRef.current.objectVolume = v
              }}
            />
          </ControlSection>
          <ControlSection title="Fluid">
            <ControlSlider
              label="Fluid density"
              value={fluidDensity}
              min={0.5}
              max={13.6}
              step={0.1}
              display={`${fluidDensity.toFixed(1)} g/cm³`}
              onChange={(v) => {
                setFluidDensity(v)
                paramsRef.current.fluidDensity = v
              }}
            />
            <ControlStats>
              <ControlStat
                label="Verdict"
                value={verdict === 'float' ? 'Floats' : verdict === 'sink' ? 'Sinks' : 'Suspends'}
              />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
