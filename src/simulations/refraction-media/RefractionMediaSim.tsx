/**
 * Controller — React UI + canvas pointer for Refraction Through Media.
 * Model updates via refs; View paints each RAF frame (no physics in the view).
 */
import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlPanel,
  ControlRadioGroup,
  ControlSlider,
  ControlStat,
  ControlStats,
  ControlToggle,
  InfoTooltip,
} from '../../sims/shared/Controls'
import { SimShell } from '../../sims/shared/SimShell'
import { useCanvasLoop } from '../../sims/shared/useCanvasLoop'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import {
  MEDIA,
  N_AIR,
  clampIncidence,
  computeRefraction,
  defaultRefractionState,
  setIncidence,
  setMedium,
  type RefractionState,
} from './model'
import { drawRefractionMedia, type RefractionLayout } from './view'

export function RefractionMediaSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RefractionState>(defaultRefractionState())
  const layoutRef = useRef<RefractionLayout | null>(null)
  const [ui, setUi] = useState(() => defaultRefractionState())
  const [version, setVersion] = useState(0)

  const syncUi = () => setUi({ ...stateRef.current })

  useCanvasPointer(canvasRef, {
    cursorForHit: () => 'grab',
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.incidentStart.x, pt.y - L.incidentStart.y) < 28) return 'laser'
      if (pt.y < L.boundaryY - 8 && Math.abs(pt.x - L.hit.x) < L.rayLen * 0.7) return 'laser'
      return null
    },
    onDrag: (_id, pt) => {
      const L = layoutRef.current
      if (!L) return
      const dx = L.hit.x - pt.x
      const dy = L.hit.y - pt.y
      const deg = (Math.atan2(dx, dy) * 180) / Math.PI
      stateRef.current = setIncidence(stateRef.current, clampIncidence(Math.round(deg)))
      syncUi()
    },
  })

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    layoutRef.current = drawRefractionMedia(ctx, w, h, stateRef.current)
  }, [])

  useCanvasLoop(canvasRef, draw, true, version, true)

  const { medium, refractedDeg } = computeRefraction(ui)

  return (
    <SimShell
      title="Refraction Through Media"
      subtitle="PhET Bending Light indices — Snell's law at an air boundary"
      canvasRef={canvasRef}
      running
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        stateRef.current = defaultRefractionState()
        syncUi()
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.35rem',
            }}
          >
            <span className="sim-ctl-section-title" style={{ margin: 0 }}>
              Controls
            </span>
            <InfoTooltip title="Snell's law">
              <p>
                Light bends at a boundary: n₁ sin i = n₂ sin r. Drag the yellow laser or use the
                slider. Indices match PhET Bending Light (red light).
              </p>
            </InfoTooltip>
          </div>

          <ControlPanel title="Medium (n₂)">
            <ControlRadioGroup
              label="Select medium"
              name="refraction-medium"
              value={ui.mediumId}
              options={MEDIA.map((m) => ({ value: m.id, label: m.label }))}
              onChange={(id) => {
                stateRef.current = setMedium(stateRef.current, id)
                syncUi()
                setVersion((v) => v + 1)
              }}
            />
          </ControlPanel>

          <ControlPanel title="Incidence">
            <ControlHint>Drag the laser on the canvas, or adjust here.</ControlHint>
            <ControlSlider
              label="Angle of incidence"
              value={ui.incidenceDeg}
              min={0}
              max={85}
              step={1}
              unit="°"
              onChange={(deg) => {
                stateRef.current = setIncidence(stateRef.current, deg)
                syncUi()
                setVersion((v) => v + 1)
              }}
            />
          </ControlPanel>

          <ControlPanel title="Display">
            <ControlToggle
              label="Show normal line"
              checked={ui.showNormal}
              onChange={(v) => {
                stateRef.current = { ...stateRef.current, showNormal: v }
                syncUi()
                setVersion((n) => n + 1)
              }}
            />
            <ControlToggle
              label="Show angle labels"
              checked={ui.showAngles}
              onChange={(v) => {
                stateRef.current = { ...stateRef.current, showAngles: v }
                syncUi()
                setVersion((n) => n + 1)
              }}
            />
          </ControlPanel>

          <ControlPanel title="Readout">
            <ControlStats>
              <ControlStat label="n₁ (air)" value={N_AIR.toFixed(6)} />
              <ControlStat label="n₂" value={medium.n.toFixed(3)} />
              <ControlStat
                label="Refracted"
                value={refractedDeg !== null ? `${Math.round(refractedDeg)}°` : 'TIR'}
              />
            </ControlStats>
          </ControlPanel>
        </>
      }
    />
  )
}
