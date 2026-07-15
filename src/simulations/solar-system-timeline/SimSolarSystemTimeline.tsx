import { useCallback, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
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
import { drawTimeline, type TimelineTrackLayout } from './view'

type TimelinePaint = { sim: SolarSystemTimelineState; animT: number }

export function SolarSystemTimelineSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<TimelinePaint>({ sim: createInitialState(), animT: 0 })
  const layoutRef = useRef<TimelineTrackLayout | null>(null)
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
    draw: (ctx, ww, hh, s) => {
      layoutRef.current = drawTimeline(ctx, ww, hh, s.sim, s.animT)
    },
    onSync: (s) => {
      setProgress(s.sim.progress)
      setRunning(s.sim.running)
    },
  })

  const applyProgress = (v: number) => {
    const next = clamp(v, MIN_PROGRESS, MAX_PROGRESS)
    stateRef.current = {
      ...stateRef.current,
      sim: { ...stateRef.current.sim, progress: next, running: false },
    }
    setProgress(next)
    setRunning(false)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (pt.y >= L.hitTop && pt.y <= L.hitBottom && pt.x >= L.pad - 8 && pt.x <= L.pad + L.trackW + 8) {
        return 'track'
      }
      return null
    },
    onDrag: (_id, pt) => {
      const L = layoutRef.current
      if (!L) return
      const t = clamp((pt.x - L.pad) / Math.max(1, L.trackW), 0, 1)
      applyProgress(MIN_PROGRESS + t * MAX_PROGRESS)
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
            Scrub from the solar system&apos;s birth to modern space missions. Drag the timeline
            track on the canvas, or use the slider.
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
              onChange={(e) => applyProgress(Number(e.target.value))}
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
