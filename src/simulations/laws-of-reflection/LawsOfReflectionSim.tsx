import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { canvasPoint } from '../shared/drawUtils'
import {
  defaultLawsState,
  drawLawsOfReflection,
  hitTestSource,
  incidenceFromSource,
  type LawsOfReflectionState,
} from './model'

export function LawsOfReflectionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [state, setState] = useState<LawsOfReflectionState>(defaultLawsState)
  const [running, setRunning] = useState(false)
  const dragging = useRef(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawLawsOfReflection(ctx, size.w, size.h, state)
  }, [size.w, size.h, state])

  useEffect(() => {
    redraw()
  }, [redraw])

  const reset = () => setState(defaultLawsState())

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pt = canvasPoint(e.clientX, e.clientY, canvas)
    if (hitTestSource(state, size.w, size.h, pt)) {
      dragging.current = true
      canvas.setPointerCapture(e.pointerId)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pt = canvasPoint(e.clientX, e.clientY, canvas)
    const mirrorY = size.h * 0.72
    const hit = { x: size.w * 0.5, y: mirrorY }
    const nx = Math.max(0.08, Math.min(0.48, pt.x / size.w))
    const ny = Math.max(0.08, Math.min(mirrorY / size.h - 0.04, pt.y / size.h))
    const source = { x: nx * size.w, y: ny * size.h }
    const incidenceDeg = incidenceFromSource(source, hit)
    setState({ sourceX: nx, sourceY: ny, incidenceDeg: Math.round(incidenceDeg) })
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const sidebar = (
    <>
      <h3>Controls</h3>
      <div className="sim-slider-row">
        <label>
          <span>Angle of incidence</span>
          <span>{state.incidenceDeg}°</span>
        </label>
        <input
          type="range"
          min={5}
          max={80}
          value={state.incidenceDeg}
          onChange={(e) => {
            const incidenceDeg = Number(e.target.value)
            setState({
              incidenceDeg,
              sourceX: 0,
              sourceY: 0,
            })
          }}
        />
      </div>
      <p className="sim-hint">Drag the yellow light source or use the slider. The reflected ray obeys ∠i = ∠r.</p>
      <p className="sim-readout">
        Incident angle: <strong>{state.incidenceDeg}°</strong>
        <br />
        Reflected angle: <strong>{state.incidenceDeg}°</strong>
      </p>
    </>
  )

  return (
    <SimShell
      title="Laws of Reflection"
      subtitle="Angle of incidence equals angle of reflection"
      canvasRef={canvasRef}
      sidebar={sidebar}
      toolbar={
        <SimTransport running={running} onToggle={() => setRunning((r) => !r)} onReset={reset} />
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    />
  )
}
