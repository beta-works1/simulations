import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  createPredatorPreyState,
  stepPredatorPrey,
  type PredatorPreyState,
} from './predatorPreyModel'

export function PredatorPreySim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<PredatorPreyState>(createPredatorPreyState())
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<PredatorPreyState['mode']>('predation')
  const [growth, setGrowth] = useState(1.1)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    const s = stateRef.current
    s.mode = mode
    s.growth = growth
    if (dt > 0 && running) stateRef.current = stepPredatorPrey(s, dt)
    const st = stateRef.current

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#10283a'
    ctx.fillRect(0, 0, w, h)

    // population dots
    const fieldH = h * 0.55
    ctx.fillStyle = '#1e8449'
    ctx.globalAlpha = 0.25
    ctx.fillRect(0, 0, w, fieldH)
    ctx.globalAlpha = 1

    const preyN = Math.min(80, Math.round(st.prey))
    const predN = Math.min(40, Math.round(st.predators))
    for (let i = 0; i < preyN; i++) {
      const x = ((i * 47 + st.time * 20) % (w - 20)) + 10
      const y = ((i * 31) % (fieldH - 30)) + 15
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#2ecc71'
      ctx.fill()
    }
    for (let i = 0; i < predN; i++) {
      const x = ((i * 53 + st.time * 12) % (w - 20)) + 10
      const y = ((i * 41 + 20) % (fieldH - 30)) + 15
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#e74c3c'
      ctx.fill()
    }

    // chart
    const chartY = fieldH + 10
    const chartH = h - chartY - 16
    ctx.fillStyle = '#0b1c2c'
    ctx.fillRect(10, chartY, w - 20, chartH)
    const hist = st.history
    if (hist.length > 1) {
      const plot = (key: 'prey' | 'predators', color: string) => {
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        hist.forEach((p, i) => {
          const x = 10 + (i / Math.max(1, hist.length - 1)) * (w - 20)
          const y = chartY + chartH - (p[key] / 120) * (chartH - 8)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
      plot('prey', '#2ecc71')
      plot('predators', '#e74c3c')
    }

    ctx.fillStyle = '#ecf0f1'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Prey ${st.prey.toFixed(1)}`, 16, 18)
    ctx.fillText(`Predators ${st.predators.toFixed(1)}`, 110, 18)
  }, [growth, mode, running])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Predator–Prey Dynamics"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPredatorPreyState()
        setMode('predation')
        setGrowth(1.1)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Compare predation, competition, and mutualism population curves.</p>
          <label>
            Interaction
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PredatorPreyState['mode'])}
            >
              <option value="predation">Predation</option>
              <option value="competition">Competition</option>
              <option value="mutualism">Mutualism</option>
            </select>
          </label>
          <label>
            Prey growth
            <input
              type="range"
              min={0.4}
              max={1.8}
              step={0.05}
              value={growth}
              onChange={(e) => setGrowth(Number(e.target.value))}
            />
          </label>
        </>
      }
    />
  )
}
