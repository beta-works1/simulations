import { useCallback, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  eventAtProgress,
  MAX_PROGRESS,
  MIN_PROGRESS,
  stepTimeline,
  type SolarSystemTimelineState,
} from './model'
import { drawTimeline } from './view'

type TimelinePaint = { sim: SolarSystemTimelineState; animT: number }

export function SolarSystemTimelineSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<TimelinePaint>({ sim: createInitialState(), animT: 0 })
  const [running, setRunning] = useState(true)
  const [progress, setProgress] = useState(0)
  const event = eventAtProgress(progress)

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running: true, // always paint; sim.running controls timeline advance
    step: (s, dt) => ({
      animT: s.animT + dt,
      sim: s.sim.running ? stepTimeline(s.sim, dt) : s.sim,
    }),
    draw: (ctx, ww, hh, s) => drawTimeline(ctx, ww, hh, s.sim, s.animT),
    onSync: (s) => {
      setProgress(s.sim.progress)
      setRunning(s.sim.running)
    },
  })

  const reset = useCallback(() => {
    stateRef.current = { sim: createInitialState(), animT: 0 }
    setProgress(0)
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Space Timeline"
      subtitle="From the solar system's birth to modern space missions."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Space Timeline</h3>
          <p className="sim-hint">
            Scrub from the solar system&apos;s birth to modern space missions. Each era shows a
            different vignette.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Timeline</span>
              <span>{event.yearLabel}</span>
            </label>
            <input
              type="range"
              min={MIN_PROGRESS}
              max={MAX_PROGRESS}
              step={0.01}
              value={progress}
              onChange={(e) => {
                const v = Number(e.target.value)
                setProgress(v)
                stateRef.current = {
                  ...stateRef.current,
                  sim: { ...stateRef.current.sim, progress: v, running: false },
                }
              }}
            />
          </div>
          <p className="sim-readout">
            {event.title}
            <br />
            {event.description}
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => {
            const next = !stateRef.current.sim.running
            stateRef.current = {
              ...stateRef.current,
              sim: { ...stateRef.current.sim, running: next },
            }
            setRunning(next)
          }}
          onReset={reset}
        />
      }
    />
  )
}
