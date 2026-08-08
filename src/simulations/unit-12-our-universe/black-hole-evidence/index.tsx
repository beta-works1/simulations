import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { evidenceState } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'wobble',
    label: 'Orbital wobble',
    detail: 'Turn on the wobble animation — stars orbit an unseen massive centre.',
  },
  {
    id: 'gw',
    label: 'GW ripple',
    detail: 'Show the gravitational-wave ripple from merging black holes.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'We infer black holes from how nearby stars move (wobble / orbits) (p.153).',
    'Merging black holes produce gravitational-wave ripples detected on Earth.',
  ],
  quiz: {
    question: 'Gravitational waves from black holes are…',
    choices: ['Sound in air', 'Ripples in spacetime', 'Visible rainbow light only'],
    correctIndex: 1,
  },
}

export function BlackHoleEvidenceSim() {
  const [playWobble, setPlayWobble] = useState(false)
  const [showGwRipple, setShowGwRipple] = useState(false)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const state = evidenceState(playWobble, showGwRipple)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && playWobble) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && showGwRipple) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, playWobble, showGwRipple, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Black hole evidence (p.153)">
        Toggle orbital wobble and gravitational-wave ripple clues.
      </ActivityCallout>
      <ToggleSwitch label="Play wobble animation" checked={playWobble} onChange={setPlayWobble} />
      <ToggleSwitch label="Show GW ripple" checked={showGwRipple} onChange={setShowGwRipple} />
      <ReadoutBadge label="Wobble" value={playWobble ? 'On' : 'Off'} />
      <ReadoutBadge label="GW ripple" value={showGwRipple ? 'On' : 'Off'} />
      {(exploreMode || (playWobble && showGwRipple)) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="black-hole-evidence"
      unitId="unit-12"
      unitNumber={12}
      title="Black Hole Evidence"
      slo={[
        'Describe stellar wobble as evidence for a black hole.',
        'Link merging black holes to gravitational waves.',
      ]}
      bookPage={153}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setPlayWobble(false)
        setShowGwRipple(false)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
        <div
          style={{
            position: 'relative',
            height: 180,
            borderRadius: 12,
            background: '#0f172a',
            overflow: 'hidden',
          }}
          role="img"
          aria-label={state.caption}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 28,
              height: 28,
              margin: '-14px 0 0 -14px',
              borderRadius: '50%',
              background: '#020617',
              boxShadow: '0 0 0 6px #1e293b',
            }}
          />
          {playWobble && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 10,
                height: 10,
                margin: '-5px 0 0 -5px',
                borderRadius: '50%',
                background: '#fde047',
                animation: 'gs8-bh-wobble 2.4s linear infinite',
              }}
            />
          )}
          {showGwRipple && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 40,
                  height: 40,
                  margin: '-20px 0 0 -20px',
                  borderRadius: '50%',
                  border: '2px solid rgba(125,211,252,0.7)',
                  animation: 'gs8-bh-ripple 1.8s ease-out infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 40,
                  height: 40,
                  margin: '-20px 0 0 -20px',
                  borderRadius: '50%',
                  border: '2px solid rgba(125,211,252,0.45)',
                  animation: 'gs8-bh-ripple 1.8s ease-out 0.6s infinite',
                }}
              />
            </>
          )}
          <style>{`
            @keyframes gs8-bh-wobble {
              from { transform: rotate(0deg) translateX(56px); }
              to { transform: rotate(360deg) translateX(56px); }
            }
            @keyframes gs8-bh-ripple {
              from { transform: scale(1); opacity: 0.9; }
              to { transform: scale(4.5); opacity: 0; }
            }
          `}</style>
        </div>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{state.caption}</p>
      </div>
    </SimulationShell>
  )
}
