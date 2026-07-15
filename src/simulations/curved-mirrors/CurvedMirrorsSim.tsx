import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  computeCurvedLayout,
  defaultCurvedState,
  type CurvedMirrorsState,
  type MirrorType,
} from './model'
import { drawCurvedMirrors } from './view'

type ObjectLayout = {
  objectX: number
  axisY: number
  objectH: number
  poleX: number
}

export function CurvedMirrorsSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const stateRef = useRef<CurvedMirrorsState>(defaultCurvedState())
  const layoutRef = useRef<ObjectLayout | null>(null)
  const [type, setTypeUi] = useState<MirrorType>(defaultCurvedState().type)
  const [objectDist, setObjectDist] = useState(defaultCurvedState().objectDist)
  const [version, setVersion] = useState(0)
  const [running, setRunning] = useState(false)

  const bump = () => setVersion((v) => v + 1)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current
    drawCurvedMirrors(ctx, size.w, size.h, s)
    const layout = computeCurvedLayout(size.w, size.h, s)
    layoutRef.current = {
      objectX: layout.objectX,
      axisY: layout.axisY,
      objectH: layout.objectH,
      poleX: layout.pole.x,
    }
  }, [size.w, size.h])

  useEffect(() => {
    paint()
  }, [paint, version, type, objectDist])

  const layout = computeCurvedLayout(size.w, size.h, stateRef.current)

  const setObjectDistance = (d: number) => {
    const v = clamp(d, 0.3, 0.9)
    stateRef.current = { ...stateRef.current, objectDist: v }
    setObjectDist(v)
    bump()
  }

  const setType = (next: MirrorType) => {
    stateRef.current = { ...stateRef.current, type: next }
    setTypeUi(next)
    bump()
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.abs(pt.x - L.objectX) < 28 && pt.y > L.axisY - L.objectH - 20 && pt.y < L.axisY + 20) {
        return 'object'
      }
      return null
    },
    onDrag: (_id, pt) => {
      const L = layoutRef.current
      if (!L || size.w < 2) return
      setObjectDistance((L.poleX - pt.x) / size.w)
    },
  })

  const sidebar = (
    <>
      <h3>Mirror</h3>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`sim-btn ${type === 'concave' ? 'is-active' : ''}`}
          onClick={() => setType('concave')}
        >
          Concave
        </button>
        <button
          type="button"
          className={`sim-btn ${type === 'convex' ? 'is-active' : ''}`}
          onClick={() => setType('convex')}
        >
          Convex
        </button>
      </div>
      <div className="sim-slider-row">
        <label>
          <span>Object distance</span>
          <span>{Math.round(objectDist * 100)}%</span>
        </label>
        <input
          type="range"
          min={30}
          max={90}
          value={Math.round(objectDist * 100)}
          onChange={(e) => setObjectDistance(Number(e.target.value) / 100)}
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
        Drag the object along the principal axis. Ray diagrams show how light reflects. Image
        position follows 1/f = 1/u + 1/v.
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
          onReset={() => {
            stateRef.current = defaultCurvedState()
            setTypeUi(defaultCurvedState().type)
            setObjectDist(defaultCurvedState().objectDist)
            bump()
          }}
        />
      }
    />
  )
}
