import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  defaultRainbowState,
  drawRainbowDispersion,
  stepRainbow,
  type RainbowState,
} from './model'

export function RainbowDispersionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [state, setState] = useState<RainbowState>(defaultRainbowState)
  const [running, setRunning] = useState(true)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawRainbowDispersion(ctx, size.w, size.h, state)
  }, [size.w, size.h, state])

  useEffect(() => {
    redraw()
  }, [redraw])

  useAnimationLoop(running, (dt) => {
    setState((s) => stepRainbow(s, dt))
  })

  const reset = () => {
    setState(defaultRainbowState())
    setRunning(true)
  }

  const sidebar = (
    <>
      <h3>Animation</h3>
      <div className="sim-slider-row">
        <label>
          <span>Speed</span>
          <span>{state.speed.toFixed(1)}×</span>
        </label>
        <input
          type="range"
          min={0.3}
          max={2.5}
          step={0.1}
          value={state.speed}
          onChange={(e) => setState((s) => ({ ...s, speed: Number(e.target.value) }))}
        />
      </div>
      <p className="sim-hint">
        White light refracts and disperses inside a water droplet. Different wavelengths bend by
        different amounts, separating into a spectrum.
      </p>
      <p className="sim-readout">
        Phase: <strong>{Math.round(state.phase * 100)}%</strong>
      </p>
    </>
  )

  return (
    <SimShell
      canvasRef={canvasRef}
      sidebar={sidebar}
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={reset}
        />
      }
    />
  )
}
