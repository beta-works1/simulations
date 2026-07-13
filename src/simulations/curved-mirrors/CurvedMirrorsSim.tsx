import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  computeCurvedLayout,
  defaultCurvedState,
  drawCurvedMirrors,
  type CurvedMirrorsState,
  type MirrorType,
} from './model'

export function CurvedMirrorsSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [state, setState] = useState<CurvedMirrorsState>(defaultCurvedState)
  const [running, setRunning] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCurvedMirrors(ctx, size.w, size.h, state)
  }, [size.w, size.h, state])

  useEffect(() => {
    redraw()
  }, [redraw])

  const layout = computeCurvedLayout(size.w, size.h, state)

  const sidebar = (
    <>
      <h3>Mirror</h3>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`sim-btn ${state.type === 'concave' ? 'is-active' : ''}`}
          onClick={() => setState((s) => ({ ...s, type: 'concave' as MirrorType }))}
        >
          Concave
        </button>
        <button
          type="button"
          className={`sim-btn ${state.type === 'convex' ? 'is-active' : ''}`}
          onClick={() => setState((s) => ({ ...s, type: 'convex' as MirrorType }))}
        >
          Convex
        </button>
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Object distance</span>
          <span>{Math.round(state.objectDist * 100)}%</span>
        </label>
        <input
          type="range"
          min={30}
          max={90}
          value={Math.round(state.objectDist * 100)}
          onChange={(e) =>
            setState((s) => ({ ...s, objectDist: Number(e.target.value) / 100 }))
          }
        />
      </div>
      <p className="sim-readout">
        Image type:{' '}
        <strong>{layout.imageVirtual ? 'Virtual' : 'Real'}</strong>
        <br />
        Magnification:{' '}
        <strong>{(layout.imageH / layout.objectH).toFixed(2)}×</strong>
      </p>
      <p className="sim-hint">
        Ray diagrams show how light reflects. Image position follows 1/f = 1/u + 1/v.
      </p>
    </>
  )

  return (
    <SimShell
      title="Concave & Convex Mirrors"
      subtitle="Image type changes with object distance"
      canvasRef={canvasRef}
      sidebar={sidebar}
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={() => setState(defaultCurvedState())}
        />
      }
    />
  )
}
