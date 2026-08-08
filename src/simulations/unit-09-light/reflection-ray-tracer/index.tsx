import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { reflectionAt } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'aim',
    label: 'Set incidence',
    detail: 'Drag the incidence angle. Watch the reflected ray update.',
  },
  {
    id: 'law',
    label: 'Check i = r',
    detail: 'Read the angle badges — angle of incidence equals angle of reflection.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'The normal is perpendicular to the mirror at the point of incidence.',
    'Law of reflection: angle of incidence = angle of reflection (i = r).',
  ],
  quiz: {
    question: 'If the angle of incidence is 35°, the angle of reflection is…',
    choices: ['55°', '35°', '70°'],
    correctIndex: 1,
  },
}

export function ReflectionRayTracerSim() {
  const [angle, setAngle] = useState(35)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const rays = reflectionAt(angle)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && Math.abs(angle - 35) > 2) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && rays.lawHolds) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, angle, rays.lawHolds, setGuidedStepIndex, setRecapOpen])

  const hit = { x: 220, y: 140 }
  const len = 120
  const src = {
    x: hit.x - rays.incident.x * len,
    y: hit.y - rays.incident.y * len,
  }
  const end = {
    x: hit.x + rays.reflected.x * len,
    y: hit.y + rays.reflected.y * len,
  }
  const nStart = { x: hit.x + rays.normal.x * 50, y: hit.y + rays.normal.y * 50 }
  const nEnd = { x: hit.x - rays.normal.x * 50, y: hit.y - rays.normal.y * 50 }

  const controls = (
    <>
      <ActivityCallout title="Law of reflection (p.112)">
        Change the incidence angle. The reflected ray obeys i = r.
      </ActivityCallout>
      <Slider label="Incidence angle" min={0} max={80} step={1} value={angle} unit="°" onChange={setAngle} />
      <ReadoutBadge label="i (incidence)" value={`${rays.incidenceDeg.toFixed(0)}°`} />
      <ReadoutBadge label="r (reflection)" value={`${rays.reflectionDeg.toFixed(0)}°`} />
      <ReadoutBadge label="Law" value={rays.lawHolds ? 'i = r ✓' : 'check rays'} />
      {(exploreMode || guidedStepIndex >= 1) && (
        <button
          type="button"
          className="gs8-btn"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => setRecapOpen(true)}
        >
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="reflection-ray-tracer"
      unitId="unit-09"
      unitNumber={9}
      title="Law of Reflection Ray Tracer"
      slo={[
        'Identify incident ray, reflected ray, and normal.',
        'Verify that angle of incidence equals angle of reflection.',
      ]}
      bookPage={112}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setAngle(35)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1rem', height: '100%' }}>
        <svg viewBox="0 0 400 280" width="100%" height="100%" role="img" aria-label="Reflection ray diagram">
          <rect x="0" y="0" width="400" height="280" fill="#0f172a" />
          {/* Vertical mirror */}
          <line x1={hit.x} y1="40" x2={hit.x} y2="240" stroke="#94a3b8" strokeWidth="8" />
          <text x={hit.x + 12} y="56" fill="#cbd5e1" fontSize="12">
            Mirror
          </text>
          {/* Normal */}
          <line
            x1={nStart.x}
            y1={nStart.y}
            x2={nEnd.x}
            y2={nEnd.y}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <text x={nStart.x - 8} y={nStart.y - 8} fill="#38bdf8" fontSize="11">
            Normal
          </text>
          {/* Incident */}
          <line x1={src.x} y1={src.y} x2={hit.x} y2={hit.y} stroke="#fbbf24" strokeWidth="3" />
          <text x={src.x} y={src.y - 8} fill="#fbbf24" fontSize="12">
            Incident
          </text>
          {/* Reflected */}
          <line x1={hit.x} y1={hit.y} x2={end.x} y2={end.y} stroke="#4ade80" strokeWidth="3" />
          <text x={end.x - 40} y={end.y - 8} fill="#4ade80" fontSize="12">
            Reflected
          </text>
          <circle cx={hit.x} cy={hit.y} r="5" fill="#f8fafc" />
          <text x="16" y="260" fill="#e2e8f0" fontSize="14">
            i = {rays.incidenceDeg.toFixed(0)}° · r = {rays.reflectionDeg.toFixed(0)}°
          </text>
        </svg>
      </div>
    </SimulationShell>
  )
}
