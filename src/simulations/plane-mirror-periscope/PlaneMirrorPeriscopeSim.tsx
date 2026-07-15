import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  defaultPlaneState,
  type MirrorMode,
  type PlaneMirrorState,
} from './model'
import { drawPlaneMirrorPeriscope } from './view'

export function PlaneMirrorPeriscopeSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [state, setState] = useState<PlaneMirrorState>(defaultPlaneState)
  const [running, setRunning] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawPlaneMirrorPeriscope(ctx, size.w, size.h, state)
  }, [size.w, size.h, state])

  useEffect(() => {
    redraw()
  }, [redraw])

  const setMode = (mode: MirrorMode) => setState((s) => ({ ...s, mode }))

  const sidebar = (
    <>
      <h3>Mode</h3>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`sim-btn ${state.mode === 'plane' ? 'is-active' : ''}`}
          onClick={() => setMode('plane')}
        >
          Plane mirror
        </button>
        <button
          type="button"
          className={`sim-btn ${state.mode === 'periscope' ? 'is-active' : ''}`}
          onClick={() => setMode('periscope')}
        >
          Periscope
        </button>
      </div>
      {state.mode === 'plane' && (
        <div className="sim-slider-row">
          <label>
            <span>Object distance</span>
            <span>{Math.round(state.objectDist * 100)}%</span>
          </label>
          <input
            type="range"
            min={15}
            max={45}
            value={Math.round(state.objectDist * 100)}
            onChange={(e) =>
              setState((s) => ({ ...s, objectDist: Number(e.target.value) / 100 }))
            }
          />
        </div>
      )}
      <p className="sim-hint">
        {state.mode === 'plane'
          ? 'The virtual image is as far behind the mirror as the object is in front.'
          : 'Light reflects off two 45° mirrors so you can see over obstacles.'}
      </p>
    </>
  )

  return (
    <SimShell
      title="Plane Mirror & Periscope"
      subtitle="Virtual images and two-mirror sight lines"
      canvasRef={canvasRef}
      sidebar={sidebar}
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={() => setState(defaultPlaneState())}
        />
      }
    />
  )
}
