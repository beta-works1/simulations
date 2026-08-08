import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import {
  areaForOrientation,
  pressure,
  sinkDepth,
  type Orientation,
} from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'face',
    label: 'Face down',
    detail: 'Keep the block face-down (large area). Raise the force and note how little it sinks.',
  },
  {
    id: 'edge',
    label: 'Edge down',
    detail: 'Flip to edge-down (small area). Same force — much higher pressure and deeper sink.',
  },
  {
    id: 'formula',
    label: 'Check P = F/A',
    detail: 'Compare the pressure readout, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Pressure = force ÷ area (P = F/A). Same force on a smaller area means larger pressure.',
    'A sharp edge digs into sand more than a flat face because the contact area is smaller.',
  ],
  quiz: {
    question: 'If force stays the same and area gets smaller, pressure…',
    choices: ['Decreases', 'Stays the same', 'Increases'],
    correctIndex: 2,
  },
}

export function PressureForceAreaSim() {
  const [force, setForce] = useState(20)
  const [edgeDown, setEdgeDown] = useState(false)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const orientation: Orientation = edgeDown ? 'edge-down' : 'face-down'
  const area = areaForOrientation(orientation)
  const p = pressure(force, area)
  const depth = sinkDepth(force, area)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && !edgeDown && force >= 30) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && edgeDown) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && edgeDown) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, edgeDown, force, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Pressure on sand (p.97)">
        Change the force and whether the block rests on its face or edge. Watch pressure and sink depth.
      </ActivityCallout>
      <Slider label="Force" min={5} max={100} step={1} value={force} onChange={setForce} unit=" N" />
      <ToggleSwitch label="Edge-down (small area)" checked={edgeDown} onChange={setEdgeDown} />
      <ReadoutBadge label="Area" value={`${area} cm²`} />
      <ReadoutBadge label="Pressure" value={`${p.toFixed(2)} N/cm²`} />
      {(exploreMode || guidedStepIndex >= 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  const blockW = edgeDown ? 36 : 100
  const blockH = edgeDown ? 70 : 40
  const sinkPx = 8 + depth * 70

  return (
    <SimulationShell
      simId="pressure-force-area"
      unitId="unit-08"
      unitNumber={8}
      title="Pressure: Force and Area"
      slo={[
        'Calculate pressure as force divided by area.',
        'Explain why a smaller contact area increases pressure.',
      ]}
      bookPage={97}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setForce(20)
        setEdgeDown(false)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '0.75rem', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>
          {edgeDown ? 'Edge-down — small area, high pressure' : 'Face-down — large area, low pressure'}
        </p>
        <div
          style={{
            position: 'relative',
            height: 200,
            borderRadius: 12,
            background: 'linear-gradient(180deg,#bae6fd 0%,#fde68a 55%,#d97706 100%)',
            overflow: 'hidden',
          }}
          role="img"
          aria-label={`Pressure ${p.toFixed(2)} N per cm², sink depth ${(depth * 100).toFixed(0)}%`}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 48 + sinkPx * 0.15,
              width: blockW,
              height: blockH,
              marginLeft: -blockW / 2,
              marginBottom: -sinkPx * 0.35,
              borderRadius: 6,
              background: 'linear-gradient(180deg,#94a3b8,#64748b)',
              border: '3px solid #334155',
              transition: 'all 0.3s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 40,
              width: Math.max(blockW + 24, 80),
              height: sinkPx,
              marginLeft: -Math.max(blockW + 24, 80) / 2,
              borderRadius: '50% 50% 40% 40%',
              background: 'rgba(120,53,15,0.45)',
              transition: 'height 0.3s ease, width 0.3s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 56,
              background: 'linear-gradient(180deg,#fbbf24,#b45309)',
            }}
          />
        </div>
      </div>
    </SimulationShell>
  )
}
