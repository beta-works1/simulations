import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { DEFAULT_FOCAL, sphericalImage, type MirrorKind } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'concave-far',
    label: 'Concave beyond C',
    detail: 'Keep concave on and set object distance past C (e.g. 50 cm).',
  },
  {
    id: 'inside-f',
    label: 'Inside F',
    detail: 'Move the object inside F — the image becomes virtual and upright.',
  },
  {
    id: 'convex',
    label: 'Try convex',
    detail: 'Switch to convex — the image stays virtual, upright, and diminished.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Concave mirrors can form real inverted or virtual upright images depending on object distance.',
    'A convex mirror always forms a virtual, upright, diminished image.',
  ],
  quiz: {
    question: 'An object inside the focus of a concave mirror produces an image that is…',
    choices: ['Real and inverted', 'Virtual and upright', 'Real and upright'],
    correctIndex: 1,
  },
}

export function SphericalMirrorsSim() {
  const [kind, setKind] = useState<MirrorKind>('concave')
  const [objectDistance, setObjectDistance] = useState(30)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const img = sphericalImage(kind, objectDistance)
  const f = DEFAULT_FOCAL
  const C = 2 * f

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && kind === 'concave' && objectDistance > C) {
      setGuidedStepIndex(1)
    }
    if (guidedStepIndex === 1 && kind === 'concave' && objectDistance < f) {
      setGuidedStepIndex(2)
    }
    if (guidedStepIndex === 2 && kind === 'convex') {
      setRecapOpen(true)
    }
  }, [exploreMode, guidedStepIndex, kind, objectDistance, C, f, setGuidedStepIndex, setRecapOpen])

  const mirrorX = 320
  const scale = 2.2
  const objX = mirrorX - objectDistance * scale
  const fX = mirrorX - f * scale
  const cX = mirrorX - C * scale
  const upright = img.orientation === 'upright'
  const virtual = img.nature === 'virtual'
  // Schematic image position (not exact formula — case labels are the learning goal)
  const imgX =
    kind === 'convex'
      ? mirrorX + Math.min(40, objectDistance * 0.4)
      : objectDistance < f
        ? mirrorX + 36
        : mirrorX - Math.min(objectDistance * 0.55, 160) * scale * 0.35

  const controls = (
    <>
      <ActivityCallout title="Spherical mirrors (p.119)">
        Toggle concave/convex and change object distance to match textbook cases.
      </ActivityCallout>
      <ToggleSwitch
        label={kind === 'concave' ? 'Concave mirror' : 'Convex mirror'}
        checked={kind === 'concave'}
        onChange={(on) => setKind(on ? 'concave' : 'convex')}
      />
      <Slider
        label="Object distance"
        min={8}
        max={70}
        step={1}
        value={objectDistance}
        unit=" cm"
        onChange={setObjectDistance}
      />
      <ReadoutBadge label="Nature" value={img.nature} />
      <ReadoutBadge label="Orientation" value={img.orientation} />
      <ReadoutBadge label="Size" value={img.size} />
      {(exploreMode || kind === 'convex') && (
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
      simId="spherical-mirrors"
      unitId="unit-09"
      unitNumber={9}
      title="Spherical Mirrors"
      slo={[
        'Classify images from concave mirrors by object position (beyond C, between F & C, inside F).',
        'Recognise that convex mirrors always give virtual, upright, diminished images.',
      ]}
      bookPage={119}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setKind('concave')
        setObjectDistance(30)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1rem', height: '100%', display: 'grid', gap: '0.75rem' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#152033' }}>{img.label}</p>
        <svg viewBox="0 0 400 260" width="100%" height="100%" role="img" aria-label="Spherical mirror diagram">
          <rect x="0" y="0" width="400" height="260" fill="#f1f5f9" />
          {/* Principal axis */}
          <line x1="20" y1="130" x2="380" y2="130" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Mirror curve */}
          <path
            d={
              kind === 'concave'
                ? `M ${mirrorX} 50 Q ${mirrorX - 28} 130 ${mirrorX} 210`
                : `M ${mirrorX} 50 Q ${mirrorX + 28} 130 ${mirrorX} 210`
            }
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="5"
          />
          {/* F and C markers */}
          <circle cx={fX} cy="130" r="4" fill="#f59e0b" />
          <text x={fX - 4} y="150" fontSize="11" fill="#b45309">
            F
          </text>
          <circle cx={cX} cy="130" r="4" fill="#ef4444" />
          <text x={cX - 4} y="150" fontSize="11" fill="#b91c1c">
            C
          </text>
          {/* Object arrow */}
          <line x1={objX} y1="130" x2={objX} y2="70" stroke="#15803d" strokeWidth="3" />
          <polygon points={`${objX},70 ${objX - 7},86 ${objX + 7},86`} fill="#15803d" />
          <text x={objX - 12} y="168" fontSize="11" fill="#15803d">
            Object
          </text>
          {/* Image arrow */}
          {img.size !== 'at infinity' && (
            <>
              <line
                x1={imgX}
                y1="130"
                x2={imgX}
                y2={upright ? 90 : 170}
                stroke="#a855f7"
                strokeWidth="3"
                strokeDasharray={virtual ? '5 4' : undefined}
              />
              <polygon
                points={
                  upright
                    ? `${imgX},90 ${imgX - 7},104 ${imgX + 7},104`
                    : `${imgX},170 ${imgX - 7},156 ${imgX + 7},156`
                }
                fill="#a855f7"
                opacity="0.85"
              />
              <text x={imgX - 10} y="198" fontSize="11" fill="#7e22ce">
                {img.nature} / {img.orientation}
              </text>
            </>
          )}
        </svg>
      </div>
    </SimulationShell>
  )
}
