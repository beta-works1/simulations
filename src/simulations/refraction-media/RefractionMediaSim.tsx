import { useCallback, useRef, useState } from 'react'
import {
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
  InfoTooltip,
} from '../../sims/shared/Controls'
import { SimShell } from '../../sims/shared/SimShell'
import { useCanvasLoop } from '../../sims/shared/useCanvasLoop'
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
