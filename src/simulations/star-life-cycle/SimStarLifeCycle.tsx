import { useCallback, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  scrubToStage,
  setMass,
  stagesForMass,
  stepStarLifeCycle,
  type StarLifeCycleState,
} from './model'
import { drawStarLifeCycle, type StarLifeLayout } from './view'

function inRect(
  pt: { x: number; y: number },
  r: { x: number; y: number; w: number; h: number },
) {
  return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h
}

export function StarLifeCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<StarLifeCycleState>(createInitialState())
  const layoutRef = useRef<StarLifeLayout | null>(null)
  const [running, setRunning] = useState(true)
  const [mass, setMassUi] = useState(createInitialState().mass)
  const [stageIndex, setStageIndex] = useState(0)
  const stages = stagesForMass(mass)
  const stage = stages[Math.min(stageIndex, stages.length - 1)] ?? stages[0]

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepStarLifeCycle({ ...s, running: true }, dt),
    draw: (ctx, ww, hh, s) => {
      layoutRef.current = drawStarLifeCycle(ctx, ww, hh, s)
    },
    onSync: (s) => {
      setMassUi(s.mass)
      setStageIndex(s.stageIndex)
    },
  })

  const applyStage = (index: number) => {
    const next = scrubToStage(stateRef.current, index)
    stateRef.current = next
    setStageIndex(next.stageIndex)
  }

  const applyMass = (nextMass: 'low' | 'high') => {
    const next = setMass(stateRef.current, nextMass)
    stateRef.current = next
    setMassUi(next.mass)
    setStageIndex(next.stageIndex)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (inRect(pt, L.lowMass)) return 'mass-low'
      if (inRect(pt, L.highMass)) return 'mass-high'
      if (inRect(pt, L.scrub)) return 'scrub'
      return null
    },
    cursorForHit: (id) => (id.startsWith('mass') ? 'pointer' : 'grab'),
    onDrag: (id, pt) => {
      if (id !== 'scrub') return
      const L = layoutRef.current
      if (!L) return
      const stagesNow = stagesForMass(stateRef.current.mass)
      const t = clamp((pt.x - L.scrub.x) / Math.max(1, L.scrub.w), 0, 1)
      applyStage(Math.round(t * (stagesNow.length - 1)))
    },
    onTap: (id) => {
      if (id === 'mass-low') applyMass('low')
      if (id === 'mass-high') applyMass('high')
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setMassUi(createInitialState().mass)
    setStageIndex(0)
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Star Life Cycle"
      subtitle="A star's fate depends on its mass."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Star Life Cycle</h3>
          <p className="sim-hint">
            A star&apos;s fate depends on its mass. Drag the stage scrubber, tap Low/High mass on
            the canvas, or use the controls.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Mass</span>
            </label>
            <select
              className="sim-select"
              value={mass}
              onChange={(e) => applyMass(e.target.value as 'low' | 'high')}
            >
              <option value="low">Low mass (like the Sun)</option>
              <option value="high">High mass (supernova path)</option>
            </select>
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Stage</span>
              <span>{stage.label}</span>
            </label>
            <input
              type="range"
              min={0}
              max={stages.length - 1}
              step={1}
              value={stageIndex}
              onChange={(e) => applyStage(Number(e.target.value))}
            />
          </div>
          <p className="sim-readout">
            {stageIndex + 1} / {stages.length}: {stage.description}
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
