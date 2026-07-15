import { useCallback, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  phaseLabel,
  stepBlackHole,
  type BlackHoleState,
} from './model'
import { drawBlackHole } from './view'

export function BlackHoleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<BlackHoleState>(createInitialState())
  const [running, setRunning] = useState(true)
  const [phase, setPhase] = useState(phaseLabel(createInitialState().phase))
  const [detail, setDetail] = useState('Collapse: 0%')

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
      setDetail(
        s.phase === 'collapse'
          ? `Collapse: ${(s.collapseProgress * 100).toFixed(0)}%`
          : 'Gravitational lensing active',
      )
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setRunning(true)
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
            some photons fall in past the event horizon.
          </p>
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
