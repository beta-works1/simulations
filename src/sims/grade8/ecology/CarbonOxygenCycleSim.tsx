import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  createCarbonOxygenState,
  stepCarbonOxygen,
  type CarbonOxygenState,
} from './carbonOxygenModel'

export function CarbonOxygenCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CarbonOxygenState>(createCarbonOxygenState())
  const [running, setRunning] = useState(true)
  const [photo, setPhoto] = useState(0.55)
  const [resp, setResp] = useState(0.4)
  const [tick, setTick] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    const s = stateRef.current
    s.photosynthesisRate = photo
    s.respirationRate = resp
    if (dt > 0 && running) {
      stateRef.current = stepCarbonOxygen(s, dt)
    }
    const st = stateRef.current

    ctx.clearRect(0, 0, w, h)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#87ceeb')
    g.addColorStop(0.55, '#b8e0a8')
    g.addColorStop(1, '#6aa84f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    drawPool(ctx, w * 0.5, h * 0.18, 70, '#5dade2', 'Atmosphere', `CO₂ ${st.co2.toFixed(0)} · O₂ ${st.o2.toFixed(0)}`)
    drawPool(ctx, w * 0.22, h * 0.62, 58, '#27ae60', 'Plants', `C ${st.plantCarbon.toFixed(0)}`)
    drawPool(ctx, w * 0.78, h * 0.62, 58, '#e67e22', 'Animals', `C ${st.animalCarbon.toFixed(0)}`)

    const t = st.time
    drawFlow(ctx, w * 0.5, h * 0.28, w * 0.28, h * 0.5, '#2ecc71', t, 'Photosynthesis\nCO₂→O₂')
    drawFlow(ctx, w * 0.72, h * 0.5, w * 0.55, h * 0.28, '#e74c3c', t + 1.2, 'Respiration\nO₂→CO₂')
    drawFlow(ctx, w * 0.35, h * 0.68, w * 0.65, h * 0.68, '#f39c12', t + 0.6, 'Food')
  }, [photo, resp, running])

  useCanvasLoop(canvasRef, draw, running, tick)

  return (
    <SimShell
      title="Carbon–Oxygen Cycle"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createCarbonOxygenState()
        setPhoto(0.55)
        setResp(0.4)
        setTick((n) => n + 1)
      }}
      controls={
        <>
          <p className="hint">Watch CO₂ and O₂ trade places as plants and animals exchange gases.</p>
          <label>
            Photosynthesis rate
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={photo}
              onChange={(e) => setPhoto(Number(e.target.value))}
            />
          </label>
          <label>
            Respiration rate
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={resp}
              onChange={(e) => setResp(Number(e.target.value))}
            />
          </label>
          <div className="stat">
            <span>CO₂</span>
            <strong>{stateRef.current.co2.toFixed(0)}</strong>
          </div>
          <div className="stat">
            <span>O₂</span>
            <strong>{stateRef.current.o2.toFixed(0)}</strong>
          </div>
        </>
      }
    />
  )
}

function drawPool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  title: string,
  sub: string,
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = 0.9
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = '600 14px Roboto, sans-serif'
  ctx.fillText(title, x, y - 4)
  ctx.font = '12px Roboto, sans-serif'
  ctx.fillText(sub, x, y + 14)
}

function drawFlow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  t: number,
  label: string,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.setLineDash([8, 6])
  ctx.lineDashOffset = -t * 40
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  ctx.fillStyle = '#1a252f'
  ctx.font = '11px Roboto, sans-serif'
  ctx.textAlign = 'center'
  label.split('\n').forEach((line, i) => ctx.fillText(line, mx, my + i * 12 - 4))
}
