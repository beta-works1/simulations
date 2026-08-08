import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, Slider } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { boxOffset, isBalanced, motionLabel, netForce } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'equal',
    label: 'Equal pushes',
    detail: 'Set left and right pushes to the same value (e.g. 8 N). The box should stay put.',
  },
  {
    id: 'unequal',
    label: 'Unequal pushes',
    detail: 'Make one side stronger. Watch the box slide toward the weaker push.',
  },
  {
    id: 'net',
    label: 'Read the net',
    detail: 'Check that net force ≈ right − left, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Forces are balanced when they cancel — net force is nearly zero and the box does not move.',
    'An unbalanced force (net ≠ 0) changes motion; the box accelerates in the net-force direction.',
  ],
  quiz: {
    question: 'Two students push a box from opposite sides with 12 N and 12 N. The forces are…',
    choices: ['Unbalanced — box speeds up', 'Balanced — box stays put', 'Only gravity acts'],
    correctIndex: 1,
  },
}

export function BalancedUnbalancedForcesSim() {
  const [fLeft, setFLeft] = useState(8)
  const [fRight, setFRight] = useState(5)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const net = netForce(fLeft, fRight)
  const balanced = isBalanced(fLeft, fRight)
  const offset = boxOffset(fLeft, fRight)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && balanced && Math.abs(fLeft - 8) < 0.5 && Math.abs(fRight - 8) < 0.5) {
      setGuidedStepIndex(1)
    }
    if (guidedStepIndex === 1 && !balanced) {
      setGuidedStepIndex(2)
    }
    if (guidedStepIndex === 2 && !balanced) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, balanced, fLeft, fRight, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Forces on a box (p.94)">
        Push from the left and right. When forces balance, the box stays still; when they do not, it moves.
      </ActivityCallout>
      <Slider label="Left push" min={0} max={20} step={0.5} value={fLeft} onChange={setFLeft} unit=" N" />
      <Slider label="Right push" min={0} max={20} step={0.5} value={fRight} onChange={setFRight} unit=" N" />
      <ReadoutBadge label="Net force" value={`${net.toFixed(1)} N`} />
      <ReadoutBadge label="State" value={balanced ? 'Balanced' : 'Unbalanced'} />
      {(exploreMode || guidedStepIndex >= 2) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="balanced-unbalanced-forces"
      unitId="unit-08"
      unitNumber={8}
      title="Balanced vs Unbalanced Forces"
      slo={[
        'Identify balanced and unbalanced forces on an object.',
        'Relate net force (right − left) to whether a box moves.',
      ]}
      bookPage={94}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setFLeft(8)
        setFRight(5)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '1rem', alignContent: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#5a6b7f' }}>{motionLabel(fLeft, fRight)}</p>
        <div
          style={{
            position: 'relative',
            height: 140,
            borderRadius: 12,
            background: 'linear-gradient(180deg,#e2e8f0 0%,#cbd5e1 70%,#94a3b8 100%)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
          }}
          role="img"
          aria-label={motionLabel(fLeft, fRight)}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 36,
              width: 88,
              height: 56,
              marginLeft: -44 + offset,
              borderRadius: 8,
              background: 'linear-gradient(180deg,#f59e0b,#d97706)',
              border: '3px solid #92400e',
              transition: 'margin-left 0.35s ease',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              color: '#1c1917',
              fontSize: 12,
            }}
          >
            Box
          </div>
          <div style={{ position: 'absolute', left: 16, top: 52, fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
            ← {fLeft} N
          </div>
          <div style={{ position: 'absolute', right: 16, top: 52, fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>
            {fRight} N →
          </div>
        </div>
      </div>
    </SimulationShell>
  )
}
