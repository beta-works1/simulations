import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
  InfoTooltip,
} from '../../sims/shared/Controls'
import { SimShell } from '../../sims/shared/SimShell'
import { useCanvasLoop } from '../../sims/shared/useCanvasLoop'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { clamp } from '../../sims/shared/math'
import {
  MEDIA,
  computeRefraction,
  defaultRefractionState,
  setIncidence,
  setMedium,
  type RefractionState,
} from './model'
import { drawRefractionMedia } from './view'

export function RefractionMediaSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RefractionState>(defaultRefractionState())
  const [version, setVersion] = useState(0)
  const [running, setRunning] = useState(false)
  const [readout, setReadout] = useState(() => {
    const c = computeRefraction(defaultRefractionState())
    return { mediumId: 'water', incidenceDeg: 40, n: c.medium.n, refracted: c.refractedDeg }
  })

  const sync = useCallback((s: RefractionState) => {
    const c = computeRefraction(s)
    setReadout({
      mediumId: s.mediumId,
      incidenceDeg: s.incidenceDeg,
      n: c.medium.n,
      refracted: c.refractedDeg,
    })
    setVersion((v) => v + 1)
  }, [])

  const incidenceFromPoint = (pt: { x: number; y: number }, size: { w: number; h: number }) => {
    const hitX = size.w * 0.5
    const hitY = size.h * 0.55
    const dx = pt.x - hitX
    const dy = hitY - pt.y // up positive (air side)
    if (dy < 4) return null
    const deg = (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI
    return clamp(deg, 0, 85)
  }

  useCanvasPointer(canvasRef, {
    cursorForHit: () => 'grab',
    hitTest: (pt, size) => (pt.y < size.h * 0.55 ? 'laser' : null),
    onDrag: (_id, pt, size) => {
      const deg = incidenceFromPoint(pt, size)
      if (deg == null) return
      stateRef.current = setIncidence(stateRef.current, deg)
      sync(stateRef.current)
    },
    onTap: (_id, pt) => {
      const size = {
        w: canvasRef.current?.parentElement?.clientWidth ?? 640,
        h: canvasRef.current?.parentElement?.clientHeight ?? 400,
      }
      const deg = incidenceFromPoint(pt, size)
      if (deg == null) return
      stateRef.current = setIncidence(stateRef.current, deg)
      sync(stateRef.current)
    },
  })

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawRefractionMedia(ctx, w, h, stateRef.current)
  }, [])

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Refraction Through Media"
      subtitle="PhET Bending Light indices — Snell’s law at an air boundary"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = defaultRefractionState()
        setRunning(false)
        sync(stateRef.current)
      }}
      controls={
        <>
          <ControlSection title="Setup">
            <ControlHint>Drag the laser in the air above the boundary — or use the slider.</ControlHint>
            <InfoTooltip title="Snell's law">
              n₁ sin i = n₂ sin r. Drag the incidence angle or pick a denser medium to bend the ray
              more toward the normal.
            </InfoTooltip>
            <ControlSelect
              label="Medium"
              value={readout.mediumId}
              options={MEDIA.map((m) => ({ value: m.id, label: m.label }))}
              onChange={(id) => {
                stateRef.current = setMedium(stateRef.current, id)
                sync(stateRef.current)
              }}
            />
            <ControlSlider
              label="Angle of incidence"
              value={readout.incidenceDeg}
              min={0}
              max={85}
              step={1}
              unit="°"
              onChange={(deg) => {
                stateRef.current = setIncidence(stateRef.current, deg)
                sync(stateRef.current)
              }}
            />
          </ControlSection>
          <ControlSection title="Readout">
            <ControlStats>
              <ControlStat label="n₁ (air)" value="1.000293" />
              <ControlStat label="n₂" value={readout.n.toFixed(3)} />
              <ControlStat
                label="Refracted"
                value={
                  readout.refracted !== null ? `${Math.round(readout.refracted)}°` : '— (TIR)'
                }
              />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
