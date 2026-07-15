import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  defaultPlaneState,
  type MirrorMode,
  type PlaneMirrorState,
} from './model'
import { drawPlaneMirrorPeriscope } from './view'

type PlaneLayout = {
  mirrorX: number
  axisY: number
  objX: number
  objTop: number
  objectHeight: number
}

export function PlaneMirrorPeriscopeSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const stateRef = useRef<PlaneMirrorState>(defaultPlaneState())
  const layoutRef = useRef<PlaneLayout | null>(null)
  const [mode, setModeUi] = useState<MirrorMode>(defaultPlaneState().mode)
  const [objectDist, setObjectDist] = useState(defaultPlaneState().objectDist)
  const [objectHeight, setObjectHeight] = useState(defaultPlaneState().objectHeight)
  const [version, setVersion] = useState(0)
  const [running, setRunning] = useState(false)

  const bump = () => setVersion((v) => v + 1)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current
    drawPlaneMirrorPeriscope(ctx, size.w, size.h, s)
    if (s.mode === 'plane' && size.w > 1 && size.h > 1) {
      const mirrorX = size.w * 0.55
      const axisY = size.h * 0.82
      const objX = mirrorX - s.objectDist * size.w
      const objTop = axisY - s.objectHeight * size.h
      layoutRef.current = {
        mirrorX,
        axisY,
        objX,
        objTop,
        objectHeight: s.objectHeight * size.h,
      }
    } else {
      layoutRef.current = null
    }
  }, [size.w, size.h])

  useEffect(() => {
    paint()
  }, [paint, version, mode, objectDist, objectHeight])

  const setMode = (next: MirrorMode) => {
    stateRef.current = { ...stateRef.current, mode: next }
    setModeUi(next)
    bump()
  }

  const applyObject = (dist: number, height: number) => {
    const d = clamp(dist, 0.15, 0.45)
    const ht = clamp(height, 0.1, 0.45)
    stateRef.current = { ...stateRef.current, objectDist: d, objectHeight: ht }
    setObjectDist(d)
    setObjectHeight(ht)
    bump()
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      if (stateRef.current.mode !== 'plane') return null
      const L = layoutRef.current
      if (!L) return null
      if (Math.abs(pt.x - L.objX) < 30 && pt.y > L.objTop - 16 && pt.y < L.axisY + 20) {
        return 'object'
      }
      return null
    },
    onDrag: (_id, pt) => {
      const L = layoutRef.current
      if (!L || size.w < 2 || size.h < 2) return
      applyObject((L.mirrorX - pt.x) / size.w, (L.axisY - pt.y) / size.h)
    },
  })

  const sidebar = (
    <>
      <h3>Mode</h3>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`sim-btn ${mode === 'plane' ? 'is-active' : ''}`}
          onClick={() => setMode('plane')}
        >
          Plane mirror
        </button>
        <button
          type="button"
          className={`sim-btn ${mode === 'periscope' ? 'is-active' : ''}`}
          onClick={() => setMode('periscope')}
        >
          Periscope
        </button>
      </div>
      {mode === 'plane' && (
        <>
          <div className="sim-slider-row">
            <label>
              <span>Object distance</span>
              <span>{Math.round(objectDist * 100)}%</span>
            </label>
            <input
              type="range"
              min={15}
              max={45}
              value={Math.round(objectDist * 100)}
              onChange={(e) => applyObject(Number(e.target.value) / 100, objectHeight)}
            />
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Object height</span>
              <span>{Math.round(objectHeight * 100)}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={45}
              value={Math.round(objectHeight * 100)}
              onChange={(e) => applyObject(objectDist, Number(e.target.value) / 100)}
            />
          </div>
        </>
      )}
      <p className="sim-hint">
        {mode === 'plane'
          ? 'Drag the object to change distance and height. The virtual image is as far behind the mirror as the object is in front.'
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
          onReset={() => {
            stateRef.current = defaultPlaneState()
            setModeUi(defaultPlaneState().mode)
            setObjectDist(defaultPlaneState().objectDist)
            setObjectHeight(defaultPlaneState().objectHeight)
            bump()
          }}
        />
      }
    />
  )
}
