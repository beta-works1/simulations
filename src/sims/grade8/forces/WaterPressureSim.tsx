import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'

export interface WaterPressureState {
  jets: { hole: number; x: number; y: number; vx: number; vy: number; life: number }[]
  time: number
}

export function createWaterPressureState(): WaterPressureState {
  return { jets: [], time: 0 }
}

/** Gauge pressure P = ρ g h (unchanged). */
export function waterPressure(rho: number, depthM: number): number {
  return rho * 9.8 * depthM
}

export function stepWaterPressure(
  s: WaterPressureState,
  dt: number,
  running: boolean,
  fillHeight: number,
  probeDepth: number,
  rho: number,
  w: number,
  h: number,
): WaterPressureState {
  let { jets, time } = s
  time += dt

  const tankL = w * 0.28
  const tankR = w * 0.72
  const tankT = h * 0.12
  const tankB = h * 0.82
  const waterTop = tankB - fillHeight * (tankB - tankT - 10)

  const holes = [0.25, 0.5, 0.75]
  if (running) {
    for (const frac of holes) {
      const hy = tankT + frac * (tankB - tankT)
      if (hy >= waterTop) {
        const depthM = ((tankB - hy) / (tankB - tankT)) * fillHeight * 2.5
        const p = waterPressure(rho, depthM)
        const speed = Math.sqrt(Math.max(0, p)) * 1.8
        if (Math.random() < dt * 14) {
          jets.push({
            hole: frac,
            x: tankR + 4,
            y: hy,
            vx: speed * (0.85 + Math.random() * 0.3),
            vy: (Math.random() - 0.5) * 2,
            life: 1,
          })
        }
      }
    }
    const probeY = tankT + probeDepth * (tankB - tankT)
    if (probeY >= waterTop && Math.random() < dt * 10) {
      const depthM = ((tankB - probeY) / (tankB - tankT)) * fillHeight * 2.5
      const p = waterPressure(rho, depthM)
      jets.push({
        hole: -1,
        x: tankL - 4,
        y: probeY,
        vx: -Math.sqrt(Math.max(0, p)) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
      })
    }
  }

  jets = jets
    .map((j) => ({
      ...j,
      x: j.x + j.vx * dt * 18,
      y: j.y + j.vy * dt * 18,
      vy: j.vy + 28 * dt,
      life: j.life - dt * 0.9,
    }))
    .filter((j) => j.life > 0 && j.x > tankL - 80 && j.x < tankR + 120)

  return { jets, time }
}

const FLUIDS = [
  { id: 'water', label: 'Water (1.0 g/cm³)', rho: 1.0 },
  { id: 'salt', label: 'Salt water (1.03 g/cm³)', rho: 1.03 },
  { id: 'mercury', label: 'Mercury-like (13.6 g/cm³)', rho: 13.6 },
]

type Layout = {
  tankL: number
  tankR: number
  tankT: number
  tankB: number
  waterTop: number
  probeY: number
  probeX: number
}

export function WaterPressureSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createWaterPressureState())
  const paramsRef = useRef({ fillHeight: 0.85, probeDepth: 0.55 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [fillHeight, setFillHeight] = useState(0.85)
  const [probeDepth, setProbeDepth] = useState(0.55)
  const [fluidId, setFluidId] = useState('water')
  const [version, setVersion] = useState(0)
  const [pressure, setPressure] = useState(0)

  const rho = FLUIDS.find((f) => f.id === fluidId)?.rho ?? 1.0
  paramsRef.current.fillHeight = fillHeight
  paramsRef.current.probeDepth = probeDepth

  useEffect(() => {
    const id = window.setInterval(() => {
      const { fillHeight: fh, probeDepth: pd } = paramsRef.current
      setFillHeight(Math.round(fh * 100) / 100)
      setProbeDepth(Math.round(pd * 100) / 100)
      setPressure(waterPressure(rho, pd * fh * 2.5))
    }, 120)
    return () => clearInterval(id)
  }, [rho])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.abs(pt.y - L.probeY) < 16 && pt.x < L.tankL + 10) return 'probe'
      if (Math.abs(pt.y - L.waterTop) < 14 && pt.x >= L.tankL && pt.x <= L.tankR) return 'water'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      hintShown.current = false
      const L = layoutRef.current
      if (!L) return
      const span = L.tankB - L.tankT
      if (id === 'probe') {
        paramsRef.current.probeDepth = clamp((pt.y - L.tankT) / span, 0.1, 0.95)
      } else if (id === 'water') {
        paramsRef.current.fillHeight = clamp((L.tankB - pt.y) / (span - 10), 0.3, 1)
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const { fillHeight: fh, probeDepth: pd } = paramsRef.current
      if (dt > 0) stateRef.current = stepWaterPressure(stateRef.current, dt, running, fh, pd, rho, w, h)
      const st = stateRef.current
      const fs = fontPx(12, w, h)
      const hover = hoverRef.current

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#e8f4fc')
      bg.addColorStop(1, '#d6eaf8')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const tankL = w * 0.28
      const tankR = w * 0.72
      const tankT = h * 0.12
      const tankB = h * 0.82
      const waterTop = tankB - fh * (tankB - tankT - 10)

      ctx.strokeStyle = '#5d6d7e'
      ctx.lineWidth = 3
      ctx.strokeRect(tankL, tankT, tankR - tankL, tankB - tankT)

      ctx.fillStyle = rho > 5 ? 'rgba(149,165,166,0.7)' : 'rgba(52,152,219,0.5)'
      ctx.fillRect(tankL + 3, waterTop, tankR - tankL - 6, tankB - waterTop - 3)

      // Water surface handle
      drawHoverHalo(ctx, (tankL + tankR) / 2, waterTop, 18, hover === 'water')
      ctx.strokeStyle = hover === 'water' ? '#2980b9' : '#1a5276'
      ctx.lineWidth = hover === 'water' ? 3 : 2
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(tankL, waterTop)
      ctx.lineTo(tankR, waterTop)
      ctx.stroke()
      ctx.setLineDash([])
      drawLabelPill(ctx, 'water surface', (tankL + tankR) / 2, waterTop - 14, {
        fontSize: Math.max(9, fs - 2),
      })

      const holes = [0.25, 0.5, 0.75]
      for (const frac of holes) {
        const hy = tankT + frac * (tankB - tankT)
        if (hy >= waterTop) {
          ctx.fillStyle = '#2c3e50'
          ctx.beginPath()
          ctx.arc(tankR, hy, 4, 0, Math.PI * 2)
          ctx.fill()
          const depthM = ((tankB - hy) / (tankB - tankT)) * fh * 2.5
          const p = waterPressure(rho, depthM)
          drawValueChip(ctx, 'P', `${p.toFixed(1)} kPa`, tankR + 48, hy, {
            fontSize: Math.max(9, fs - 2),
            align: 'left',
          })
        }
      }

      const probeY = tankT + pd * (tankB - tankT)
      drawHoverHalo(ctx, tankL - 41, probeY, 20, hover === 'probe')
      ctx.strokeStyle = '#e74c3c'
      ctx.lineWidth = hover === 'probe' ? 3 : 2
      ctx.beginPath()
      ctx.moveTo(tankL - 30, probeY)
      ctx.lineTo(tankL, probeY)
      ctx.stroke()
      ctx.fillStyle = hover === 'probe' ? '#c0392b' : '#e74c3c'
      roundRect(ctx, tankL - 52, probeY - 14, 22, 28, 4)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `600 ${Math.max(9, fs - 2)}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('P', tankL - 41, probeY + 4)

      const depthM = pd * fh * 2.5
      const pProbe = waterPressure(rho, depthM)
      drawValueChip(ctx, 'ρgh', `${pProbe.toFixed(1)} kPa`, tankL - 70, probeY - 28, {
        fontSize: fs,
        accent: true,
      })

      layoutRef.current = {
        tankL,
        tankR,
        tankT,
        tankB,
        waterTop,
        probeY,
        probeX: tankL - 41,
      }

      for (const j of st.jets) {
        ctx.fillStyle = rho > 5 ? 'rgba(127,140,141,0.85)' : 'rgba(41,128,185,0.75)'
        ctx.beginPath()
        ctx.arc(j.x, j.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      drawLabelPill(ctx, 'depth ↓ pressure ↑', w / 2, h - 36, { fontSize: fs })
      if (hintShown.current) drawHint(ctx, 'drag probe · drag water surface', w / 2, h - 14, w, h)
    },
    [rho, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Water Pressure vs Depth"
      subtitle="Pressure increases with depth: P = ρgh"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createWaterPressureState()
        paramsRef.current = { fillHeight: 0.85, probeDepth: 0.55 }
        setFillHeight(0.85)
        setProbeDepth(0.55)
        setFluidId('water')
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Tank">
            <ControlHint>Drag the probe or water surface on the canvas.</ControlHint>
            <ControlSlider
              label="Fill height"
              value={fillHeight}
              min={0.3}
              max={1}
              step={0.05}
              display={`${Math.round(fillHeight * 100)}%`}
              onChange={(v) => {
                setFillHeight(v)
                paramsRef.current.fillHeight = v
              }}
            />
            <ControlSlider
              label="Probe depth"
              value={probeDepth}
              min={0.1}
              max={0.95}
              step={0.05}
              display={`${Math.round(probeDepth * 100)}%`}
              onChange={(v) => {
                setProbeDepth(v)
                paramsRef.current.probeDepth = v
              }}
            />
            <ControlSelect
              label="Fluid density"
              value={fluidId}
              options={FLUIDS.map((f) => ({ value: f.id, label: f.label }))}
              onChange={setFluidId}
            />
          </ControlSection>
          <ControlSection title="Reading">
            <ControlStats>
              <ControlStat label="Pressure at probe" value={`${pressure.toFixed(1)} kPa`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
