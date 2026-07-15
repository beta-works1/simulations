import { useCallback, useRef, useState } from 'react'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  galaxyById,
  GALAXIES,
  stepGalaxyTypes,
  type GalaxyType,
  type GalaxyTypesState,
} from './model'
import { drawGalaxyTypes, hitTestGalaxy } from './view'

export function GalaxyTypesSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<GalaxyTypesState>(createInitialState())
  const [running, setRunning] = useState(true)
  const [selected, setSelected] = useState<GalaxyType>(createInitialState().selected)
  const info = galaxyById(selected)

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepGalaxyTypes({ ...s, running: true }, dt),
    draw: drawGalaxyTypes,
    onSync: (s) => setSelected(s.selected),
  })

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => hitTestGalaxy(pt, size.w, size.h),
    cursorForHit: () => 'pointer',
    onTap: (id) => {
      if (!id) return
      const v = id as GalaxyType
      stateRef.current = { ...stateRef.current, selected: v }
      setSelected(v)
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setSelected(createInitialState().selected)
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Galaxy Types"
      subtitle="Compare spiral, elliptical, and irregular galaxies."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Galaxy Types</h3>
          <p className="sim-hint">
            Compare spiral, elliptical, and irregular galaxies. Tap a galaxy on the canvas or use
            the menu. Spiral arms rotate slowly as stars orbit the core.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Galaxy type</span>
            </label>
            <select
              className="sim-select"
              value={selected}
              onChange={(e) => {
                const v = e.target.value as GalaxyType
                setSelected(v)
                stateRef.current = { ...stateRef.current, selected: v }
              }}
            >
              {GALAXIES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <p className="sim-readout">{info.description}</p>
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
