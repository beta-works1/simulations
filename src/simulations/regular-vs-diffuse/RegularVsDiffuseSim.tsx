import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  defaultRegularState,
  type RegularVsDiffuseState,
  type SurfaceType,
} from './model'
import { drawRegularVsDiffuse } from './view'

export function RegularVsDiffuseSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [state, setState] = useState<RegularVsDiffuseState>(defaultRegularState)
  const [running, setRunning] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawRegularVsDiffuse(ctx, size.w, size.h, state)
  }, [size.w, size.h, state])

  useEffect(() => {
    redraw()
  }, [redraw])

  const setSurface = (surface: SurfaceType) => setState((s) => ({ ...s, surface }))

  const sidebar = (
    <>
      <h3>Surface</h3>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`sim-btn ${state.surface === 'regular' ? 'is-active' : ''}`}
          onClick={() => setSurface('regular')}
        >
          Smooth
        </button>
        <button
          type="button"
          className={`sim-btn ${state.surface === 'diffuse' ? 'is-active' : ''}`}
          onClick={() => setSurface('diffuse')}
        >
          Rough
        </button>
      </div>
      <p className="sim-hint">
        Parallel incident rays (yellow) reflect differently on smooth vs rough surfaces.
      </p>
      <p className="sim-readout">
        {state.surface === 'regular'
          ? 'On a smooth mirror, reflected rays remain parallel — this is regular reflection.'
          : 'On a rough surface, each ray reflects at a different angle — diffuse reflection.'}
      </p>
    </>
  )

  return (
    <SimShell
      title="Regular vs Diffuse Reflection"
      subtitle="Smooth surfaces vs rough scatter"
      canvasRef={canvasRef}
      sidebar={sidebar}
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={() => setState(defaultRegularState())}
        />
      }
    />
  )
}
