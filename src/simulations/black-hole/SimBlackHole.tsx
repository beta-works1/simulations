import { useCallback, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  phaseLabel,
  scrubBlackHole,
  stepBlackHole,
  timelineProgress,
  type BlackHoleState,
} from './model'
import { drawBlackHole } from './view'

export function BlackHoleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<BlackHoleState>(createInitialState())
  const runningRef = useRef(true)
  const [running, setRunning] = useState(true)
  const [phase, setPhase] = useState(phaseLabel(createInitialState().phase))
  const [detail, setDetail] = useState('Collapse: 0%')
  const [progress, setProgress] = useState(0)

  runningRef.current = running

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepBlackHole({ ...s, running: true }, dt),
    draw: drawBlackHole,
    onSync: (s) => {
      setPhase(phaseLabel(s.phase))
      setProgress(timelineProgress(s))
      setDetail(
        s.phase === 'collapse'
          ? `Collapse: ${(s.collapseProgress * 100).toFixed(0)}%`
          : 'Gravitational lensing active',
      )
    },
  })

  const applyScrub = (t: number) => {
    stateRef.current = scrubBlackHole(stateRef.current, clamp(t, 0, 1))
    const s = stateRef.current
    setProgress(timelineProgress(s))
    setPhase(phaseLabel(s.phase))
    setDetail(
      s.phase === 'collapse'
        ? `Collapse: ${(s.collapseProgress * 100).toFixed(0)}%`
        : 'Gravitational lensing active',
    )
  }

  useCanvasPointer(canvasRef, {
    hitTest: () => 'timeline',
    onDragStart: () => {
      if (runningRef.current) setRunning(false)
    },
    onDrag: (_id, pt, size) => {
      applyScrub(pt.x / Math.max(1, size.w))
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setRunning(true)
    setProgress(0)
  }, [])

  return (
    <SimShell
      title="Black Hole"
      subtitle="Watch collapse and gravitational lensing at the event horizon."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Black Hole</h3>
          <p className="sim-hint">
            Watch a massive star collapse into a black hole, then see how light paths bend — and
            some photons fall in past the event horizon. Drag across the canvas to scrub the
            timeline.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Timeline</span>
              <span>{(progress * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(e) => {
                if (running) setRunning(false)
                applyScrub(Number(e.target.value))
              }}
            />
          </div>
          <p className="sim-readout">
            Phase: {phase}
            <br />
            {detail}
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
