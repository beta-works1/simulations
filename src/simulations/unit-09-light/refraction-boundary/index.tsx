import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { apparentRefractedAngle, pencilBendOffset } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'small',
    label: 'Small angle',
    detail: 'Keep the angle low — the pencil looks only slightly bent.',
  },
  {
    id: 'large',
    label: 'Larger angle',
    detail: 'Increase the angle and watch the underwater offset grow.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Light bends (refracts) when it crosses from air into water (p.107).',
    'A pencil in a glass of water looks bent at the surface for this reason.',
  ],
  quiz: {
    question: 'A pencil in water looks bent mainly because light…',
    choices: ['Speeds up only', 'Refracts at the air–water boundary', 'Stops at the surface'],
    correctIndex: 1,
  },
}

export function RefractionBoundarySim() {
  const [angle, setAngle] = useState(20)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()

  const offset = pencilBendOffset(angle)
  const r = apparentRefractedAngle(angle)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && angle <= 25) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && angle >= 45) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, angle, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Bent pencil (p.107)">
        Change the viewing angle. The underwater part shifts — refraction at the boundary.
      </ActivityCallout>
      <Slider label="Angle" min={0} max={70} step={1} value={angle} onChange={setAngle} unit="°" />
      <ReadoutBadge label="Bend offset" value={`${offset} px`} />
      <ReadoutBadge label="Refracted ∠" value={`${r}°`} />
      {(exploreMode || angle >= 45) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="refraction-boundary"
      unitId="unit-09"
      unitNumber={9}
      title="Refraction at a Boundary"
      slo={[
        'Explain why a pencil in water looks bent.',
        'Relate larger angles to a larger apparent offset.',
      ]}
      bookPage={107}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setAngle(20)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%' }}>
        <div
          style={{
            position: 'relative',
            height: 280,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
          }}
          role="img"
          aria-label={`Pencil bend offset ${offset} pixels`}
        >
          <div style={{ position: 'absolute', inset: '0 0 50% 0', background: '#e0f2fe' }} />
          <div style={{ position: 'absolute', inset: '50% 0 0 0', background: '#7dd3fc' }} />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 24,
              width: 14,
              height: 120,
              marginLeft: -7,
              background: '#a16207',
              borderRadius: 4,
              transform: `rotate(${angle * 0.15}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 140,
              width: 14,
              height: 120,
              marginLeft: -7 + offset,
              background: '#854d0e',
              borderRadius: 4,
              transform: `rotate(${-angle * 0.1}deg)`,
              transformOrigin: 'top center',
              transition: 'margin-left 0.2s ease',
              opacity: 0.9,
            }}
          />
          <p style={{ position: 'absolute', left: 12, top: 8, margin: 0, fontSize: 12, color: '#5a6b7f' }}>
            Air
          </p>
          <p style={{ position: 'absolute', left: 12, bottom: 8, margin: 0, fontSize: 12, color: '#0c4a6e' }}>
            Water
          </p>
        </div>
      </div>
    </SimulationShell>
  )
}
