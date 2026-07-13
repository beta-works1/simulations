import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

/** 10% rule: each trophic level keeps ~10% of energy from below. */
export function createPyramidState() {
  return { baseEnergy: 10000, pulse: 0 }
}

export function EcologicalPyramidSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPyramidState())
  const [running, setRunning] = useState(true)
  const [base, setBase] = useState(10000)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    if (dt > 0 && running) stateRef.current.pulse += dt
    stateRef.current.baseEnergy = base
    const E = [base, base * 0.1, base * 0.01, base * 0.001]
    const labels = ['Producers', 'Primary consumers', 'Secondary consumers', 'Tertiary']
    const colors = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b']

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0e2433'
    ctx.fillRect(0, 0, w, h)

    const top = 36
    const bottom = h - 40
    const levels = 4
    const band = (bottom - top) / levels

    for (let i = 0; i < levels; i++) {
      const t = i / (levels - 1)
      const widthFrac = 0.25 + (1 - t) * 0.55
      const hw = (w * widthFrac) / 2
      const y = top + i * band
      const cx = w / 2
      ctx.beginPath()
      ctx.moveTo(cx - hw, y + band - 8)
      ctx.lineTo(cx + hw, y + band - 8)
      ctx.lineTo(cx + hw * 0.72, y + 8)
      ctx.lineTo(cx - hw * 0.72, y + 8)
      ctx.closePath()
      ctx.fillStyle = colors[i]
      ctx.globalAlpha = 0.85 + 0.1 * Math.sin(stateRef.current.pulse * 2 + i)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'
      ctx.font = '600 13px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(labels[i], cx, y + band / 2 - 4)
      ctx.font = '12px Roboto, sans-serif'
      ctx.fillText(`${E[i].toFixed(0)} energy units`, cx, y + band / 2 + 14)
    }

    ctx.fillStyle = '#aeb6bf'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('~10% of energy passes to the next level · 90% lost as heat', w / 2, h - 14)
  }, [base, running])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Ecological Pyramid (10% Rule)"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPyramidState()
        setBase(10000)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Only about 10% of energy moves up each trophic level.</p>
          <label>
            Producer energy
            <input
              type="range"
              min={1000}
              max={50000}
              step={500}
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
            />
          </label>
          <div className="stat">
            <span>Base</span>
            <strong>{base.toFixed(0)}</strong>
          </div>
          <div className="stat">
            <span>Top predator</span>
            <strong>{(base * 0.001).toFixed(1)}</strong>
          </div>
        </>
      }
    />
  )
}
