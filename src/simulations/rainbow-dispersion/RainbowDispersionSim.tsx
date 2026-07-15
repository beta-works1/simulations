import { useCallback, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  defaultRainbowState,
  stepRainbow,
  type RainbowState,
} from './model'
import { drawRainbowDispersion } from './view'

export function RainbowDispersionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const stateRef = useRef<RainbowState>(defaultRainbowState())
  const runningRef = useRef(true)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [phasePct, setPhasePct] = useState(0)

  runningRef.current = running

  useRefPaintLoop({
    canvasRef,
    width: size.w,
    height: size.h,
    stateRef,
    running,
    step: (s, dt) => stepRainbow({ ...s, speed }, dt),
    draw: drawRainbowDispersion,
    onSync: (s) => setPhasePct(Math.round(s.phase * 100)),
  })

  const setPhase = (phase: number) => {
    stateRef.current = { ...stateRef.current, phase: clamp(phase, 0, 1) }
  }

  useCanvasPointer(canvasRef, {
    hitTest: () => 'phase',
    onDragStart: () => {
      if (runningRef.current) setRunning(false)
    },
    onDrag: (_id, pt, s) => {
      setPhase(pt.x / Math.max(1, s.w))
    },
  })

  const reset = useCallback(() => {
    stateRef.current = defaultRainbowState()
    setSpeed(1)
    setPhasePct(0)
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Rainbow Formation"
      subtitle="Dispersion of white light in a droplet"
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Animation</h3>
          <div className="sim-slider-row">
            <label>
              <span>Speed</span>
              <span>{speed.toFixed(1)}×</span>
            </label>
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.1}
              value={speed}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSpeed(v)
                stateRef.current = { ...stateRef.current, speed: v }
              }}
            />
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Phase</span>
              <span>{phasePct}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={phasePct / 100}
              onChange={(e) => {
                const v = Number(e.target.value)
                setPhase(v)
                setPhasePct(Math.round(v * 100))
                if (running) setRunning(false)
              }}
            />
          </div>
          <p className="sim-hint">
            White light refracts and disperses inside a water droplet. Different wavelengths bend by
            different amounts, separating into a spectrum. Drag horizontally on the canvas to scrub
            the animation.
          </p>
          <p className="sim-readout">
            Phase: <strong>{phasePct}%</strong>
          </p>
        </>
      }
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
