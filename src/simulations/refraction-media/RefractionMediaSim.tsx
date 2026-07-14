import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  MEDIA,
  N_AIR,
  defaultRefractionState,
  drawRefractionMedia,
  snellRefractedAngle,
  type RefractionState,
} from './model'

export function RefractionMediaSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [state, setState] = useState<RefractionState>(defaultRefractionState)
  const [running, setRunning] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawRefractionMedia(ctx, size.w, size.h, state)
  }, [size.w, size.h, state])

  useEffect(() => {
    redraw()
  }, [redraw])

  const medium = MEDIA.find((m) => m.id === state.mediumId) ?? MEDIA[0]
  const refracted = snellRefractedAngle(state.incidenceDeg, N_AIR, medium.n)

  const sidebar = (
    <>
      <h3>Medium</h3>
      <select
        className="sim-select"
        value={state.mediumId}
        onChange={(e) => setState((s) => ({ ...s, mediumId: e.target.value }))}
      >
        {MEDIA.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <div className="sim-slider-row">
        <label>
          <span>Angle of incidence</span>
          <span>{state.incidenceDeg}°</span>
        </label>
        <input
          type="range"
          min={0}
          max={85}
          value={state.incidenceDeg}
          onChange={(e) =>
            setState((s) => ({ ...s, incidenceDeg: Number(e.target.value) }))
          }
        />
      </div>
      <p className="sim-readout">
        n₁ (air) = 1.000293
        <br />
        n₂ = {medium.n.toFixed(3)}
        <br />
        Refracted angle:{' '}
        <strong>{refracted !== null ? `${Math.round(refracted)}°` : '— (TIR)'}</strong>
      </p>
    </>
  )

  return (
    <SimShell
      title="Refraction Through Media"
      subtitle="PhET Bending Light indices — Snell’s law at an air boundary"
      canvasRef={canvasRef}
      sidebar={sidebar}
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={() => setState(defaultRefractionState())}
        />
      }
    />
  )
}
