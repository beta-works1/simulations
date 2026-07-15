import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  clampIncidence,
  defaultRegularState,
  MAX_INCIDENCE,
  MIN_INCIDENCE,
  type RegularVsDiffuseState,
  type SurfaceType,
} from './model'
import { drawRegularVsDiffuse } from './view'

export function RegularVsDiffuseSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const stateRef = useRef<RegularVsDiffuseState>(defaultRegularState())
  const [surface, setSurfaceUi] = useState<SurfaceType>(defaultRegularState().surface)
  const [incidenceDeg, setIncidenceDeg] = useState(0)
  const [version, setVersion] = useState(0)
  const [running, setRunning] = useState(false)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawRegularVsDiffuse(ctx, size.w, size.h, stateRef.current)
  }, [size.w, size.h])

  useEffect(() => {
    paint()
  }, [paint, version, surface, incidenceDeg])

  const bump = () => setVersion((v) => v + 1)

  const setSurface = (next: SurfaceType) => {
    stateRef.current = { ...stateRef.current, surface: next }
    setSurfaceUi(next)
    bump()
  }

  const setAngle = (deg: number) => {
    const v = clampIncidence(deg)
    stateRef.current = { ...stateRef.current, incidenceDeg: v }
    setIncidenceDeg(v)
    bump()
  }

  useCanvasPointer(canvasRef, {
    hitTest: () => 'angle',
    onDrag: (_id, pt, s) => {
      const t = clamp(pt.x / Math.max(1, s.w), 0, 1)
      setAngle(MIN_INCIDENCE + t * (MAX_INCIDENCE - MIN_INCIDENCE))
    },
  })

  const sidebar = (
    <>
      <h3>Surface</h3>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`sim-btn ${surface === 'regular' ? 'is-active' : ''}`}
          onClick={() => setSurface('regular')}
        >
          Smooth
        </button>
        <button
          type="button"
          className={`sim-btn ${surface === 'diffuse' ? 'is-active' : ''}`}
          onClick={() => setSurface('diffuse')}
        >
          Rough
        </button>
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Incidence angle</span>
          <span>{incidenceDeg.toFixed(0)}°</span>
        </label>
        <input
          type="range"
          min={MIN_INCIDENCE}
          max={MAX_INCIDENCE}
          step={1}
          value={incidenceDeg}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </div>
      <p className="sim-hint">
        Parallel incident rays (yellow) reflect differently on smooth vs rough surfaces. Drag
        horizontally to change the incidence angle.
      </p>
      <p className="sim-readout">
        {surface === 'regular'
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
          onReset={() => {
            stateRef.current = defaultRegularState()
            setSurfaceUi(defaultRegularState().surface)
            setIncidenceDeg(0)
            bump()
          }}
        />
      }
    />
  )
}
