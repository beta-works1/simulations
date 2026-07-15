import { useCallback, useRef, useState } from 'react'
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
import { drawStarLifeCycle } from './view'

export function StarLifeCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<StarLifeCycleState>(createInitialState())
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
    draw: drawStarLifeCycle,
    onSync: (s) => {
      setMassUi(s.mass)
      setStageIndex(s.stageIndex)
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
            A star&apos;s fate depends on its mass. Play to watch stages advance, or scrub the
            timeline.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Mass</span>
            </label>
            <select
              className="sim-select"
              value={mass}
              onChange={(e) => {
                const next = setMass(stateRef.current, e.target.value as 'low' | 'high')
                stateRef.current = next
                setMassUi(next.mass)
                setStageIndex(next.stageIndex)
              }}
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
              onChange={(e) => {
                const next = scrubToStage(stateRef.current, Number(e.target.value))
                stateRef.current = next
                setStageIndex(next.stageIndex)
              }}
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
