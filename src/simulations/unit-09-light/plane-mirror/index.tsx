import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { distanceLabel, planeMirrorImage } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'place',
    label: 'Place the object',
    detail: 'Move the object-distance slider and watch the image appear on the other side.',
  },
  {
    id: 'equal',
    label: 'Equal distances',
    detail: 'Check the two distance labels — object and image are equally far from the mirror.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'A plane mirror forms a virtual image behind the mirror.',
    'Object distance equals image distance; the image is laterally inverted.',
  ],
  quiz: {
    question: 'If an object is 10 cm in front of a plane mirror, the image is…',
    choices: ['5 cm behind', '10 cm behind', '20 cm behind'],
    correctIndex: 1,
  },
}

export function PlaneMirrorSim() {
  const [objectDistance, setObjectDistance] = useState(12)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const state = planeMirrorImage(objectDistance)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && Math.abs(objectDistance - 12) > 0.5) {
      setGuidedStepIndex(1)
    }
    if (guidedStepIndex === 1 && state.distanceEqual) {
      setRecapOpen(true)
    }
  }, [exploreMode, guidedStepIndex, objectDistance, state.distanceEqual, setGuidedStepIndex, setRecapOpen])

  // Map physics cm (−20…+20) into SVG viewBox
  const toSvgX = (x: number) => 200 + x * 8
  const objX = toSvgX(state.objectX)
  const imgX = toSvgX(state.imageX)
  const mirrorX = toSvgX(0)

  const controls = (
    <>
      <ActivityCallout title="Plane mirror (p.112)">
        Slide the object. The image stays the same distance behind the mirror.
      </ActivityCallout>
      <Slider
        label="Object distance"
        min={4}
        max={20}
        step={0.5}
        value={objectDistance}
        unit=" cm"
        onChange={setObjectDistance}
      />
      <ReadoutBadge label="Object → mirror" value={distanceLabel(objectDistance)} />
      <ReadoutBadge label="Image → mirror" value={distanceLabel(objectDistance)} />
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
      simId="plane-mirror"
      unitId="unit-09"
      unitNumber={9}
      title="Plane Mirror Image Lab"
      slo={[
        'Relate object position to image position for a plane mirror.',
        'Verify that object and image distances from the mirror are equal.',
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
        setObjectDistance(12)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1rem', height: '100%' }}>
        <svg viewBox="0 0 400 260" width="100%" height="100%" role="img" aria-label="Plane mirror diagram">
          <rect x="0" y="0" width="400" height="260" fill="#f8fafc" />
          {/* Mirror (vertical) */}
          <line x1={mirrorX} y1="40" x2={mirrorX} y2="220" stroke="#0ea5e9" strokeWidth="6" />
          <text x={mirrorX + 10} y="36" fill="#0369a1" fontSize="12">
            Mirror
          </text>
          {/* Object */}
          <line x1={objX} y1="180" x2={objX} y2="100" stroke="#15803d" strokeWidth="4" />
          <polygon points={`${objX},100 ${objX - 8},118 ${objX + 8},118`} fill="#15803d" />
          <text x={objX - 16} y="200" fill="#15803d" fontSize="12">
            Object
          </text>
          {/* Image (dashed) */}
          <line
            x1={imgX}
            y1="180"
            x2={imgX}
            y2="100"
            stroke="#a855f7"
            strokeWidth="4"
            strokeDasharray="6 4"
          />
          <polygon
            points={`${imgX},100 ${imgX - 8},118 ${imgX + 8},118`}
            fill="#a855f7"
            opacity="0.7"
          />
          <text x={imgX - 10} y="200" fill="#7e22ce" fontSize="12">
            Image
          </text>
          {/* Equal distance brackets */}
          <line x1={objX} y1="210" x2={mirrorX} y2="210" stroke="#64748b" strokeWidth="1.5" />
          <line x1={mirrorX} y1="210" x2={imgX} y2="210" stroke="#64748b" strokeWidth="1.5" />
          <text x={(objX + mirrorX) / 2 - 14} y="228" fill="#475569" fontSize="11">
            {distanceLabel(objectDistance)}
          </text>
          <text x={(mirrorX + imgX) / 2 - 14} y="228" fill="#475569" fontSize="11">
            {distanceLabel(objectDistance)}
          </text>
        </svg>
      </div>
    </SimulationShell>
  )
}
