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
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export interface WaterPressureState {
  jets: { hole: number; x: number; y: number; vx: number; vy: number; life: number }[]
  time: number
}

export function createWaterPressureState(): WaterPressureState {
  return { jets: [], time: 0 }
}

/** Gauge pressure P = ρ g h (ρ in g/cm³, h in m, g ≈ 9.8 → kPa scale). */
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

export function WaterPressureSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createWaterPressureState())
  const [running, setRunning] = useState(true)
  const [fillHeight, setFillHeight] = useState(0.85)
  const [probeDepth, setProbeDepth] = useState(0.55)
  const [fluidId, setFluidId] = useState('water')
  const [version, setVersion] = useState(0)
  const [pressure, setPressure] = useState(0)

  const rho = FLUIDS.find((f) => f.id === fluidId)?.rho ?? 1.0

  useEffect(() => {
    const depthM = probeDepth * fillHeight * 2.5
    setPressure(waterPressure(rho, depthM))
  }, [fillHeight, probeDepth, rho])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepWaterPressure(stateRef.current, dt, running, fillHeight, probeDepth, rho, w, h)
      const st = stateRef.current
      const fs = fontPx(12, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#e8f4fc')
      bg.addColorStop(1, '#d6eaf8')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const tankL = w * 0.28
      const tankR = w * 0.72
      const tankT = h * 0.12
      const tankB = h * 0.82
      const waterTop = tankB - fillHeight * (tankB - tankT - 10)

      ctx.strokeStyle = '#5d6d7e'
      ctx.lineWidth = 3
      ctx.strokeRect(tankL, tankT, tankR - tankL, tankB - tankT)

      ctx.fillStyle = rho > 5 ? 'rgba(149,165,166,0.7)' : 'rgba(52,152,219,0.5)'
      ctx.fillRect(tankL + 3, waterTop, tankR - tankL - 6, tankB - waterTop - 3)

      const holes = [0.25, 0.5, 0.75]
      for (const frac of holes) {
        const hy = tankT + frac * (tankB - tankT)
        if (hy >= waterTop) {
          ctx.fillStyle = '#2c3e50'
          ctx.beginPath()
          ctx.arc(tankR, hy, 4, 0, Math.PI * 2)
          ctx.fill()
          const depthM = ((tankB - hy) / (tankB - tankT)) * fillHeight * 2.5
          const p = waterPressure(rho, depthM)
          ctx.fillStyle = '#1a252f'
          ctx.font = `${Math.max(9, fs - 2)}px Roboto, sans-serif`
          ctx.textAlign = 'left'
          ctx.fillText(`${p.toFixed(1)} kPa`, tankR + 10, hy + 4)
        }
      }

      const probeY = tankT + probeDepth * (tankB - tankT)
      ctx.strokeStyle = '#e74c3c'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tankL - 30, probeY)
      ctx.lineTo(tankL, probeY)
      ctx.stroke()
      ctx.fillStyle = '#e74c3c'
      roundRect(ctx, tankL - 52, probeY - 14, 22, 28, 4)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `600 ${Math.max(9, fs - 2)}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('P', tankL - 41, probeY + 4)

      for (const j of st.jets) {
        ctx.fillStyle = rho > 5 ? 'rgba(127,140,141,0.85)' : 'rgba(41,128,185,0.75)'
        ctx.beginPath()
        ctx.arc(j.x, j.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      const depthM = probeDepth * fillHeight * 2.5
      const pProbe = waterPressure(rho, depthM)
      ctx.fillText(`Probe: P = ρgh = ${pProbe.toFixed(1)} kPa`, w / 2, h - 36)
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText('Deeper holes → stronger jets (more pressure)', w / 2, h - 14)
    },
    [fillHeight, fluidId, probeDepth, rho, running],
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
        setFillHeight(0.85)
        setProbeDepth(0.55)
        setFluidId('water')
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Tank">
            <ControlHint>Play to spray jets from side holes. Lower holes shoot farther.</ControlHint>
            <ControlSlider
              label="Fill height"
              value={fillHeight}
              min={0.3}
              max={1}
              step={0.05}
              display={`${Math.round(fillHeight * 100)}%`}
              onChange={setFillHeight}
            />
            <ControlSlider
              label="Probe depth"
              value={probeDepth}
              min={0.1}
              max={0.95}
              step={0.05}
              display={`${Math.round(probeDepth * 100)}%`}
              onChange={setProbeDepth}
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
