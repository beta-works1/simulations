import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, Checkbox, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { HOLE_COUNT, holeDepthLabel, streamLength } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'top',
    label: 'Open the top hole',
    detail: 'Open only the top hole. The stream should be short — pressure is lower near the surface.',
  },
  {
    id: 'bottom',
    label: 'Compare the bottom',
    detail: 'Open the bottom hole too. The deeper jet shoots farther.',
  },
  {
    id: 'all',
    label: 'All three jets',
    detail: 'Open every hole and compare stream lengths, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Water pressure increases with depth — deeper water pushes harder sideways out of a hole.',
    'A bottle with holes at different depths shows longer jets from lower holes.',
  ],
  quiz: {
    question: 'Which hole shoots water the farthest?',
    choices: ['The top hole', 'The middle hole', 'The bottom hole'],
    correctIndex: 2,
  },
}

const HOLE_LABELS = ['Top hole', 'Middle hole', 'Bottom hole']

export function WaterPressureDepthSim() {
  const [open, setOpen] = useState([false, false, false])
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow(0)

  const setHole = (i: number, v: boolean) => {
    setOpen((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && open[0] && !open[1] && !open[2]) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && open[0] && open[2]) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && open.every(Boolean)) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, open, setGuidedStepIndex, setRecapOpen])

  const controls = (
    <>
      <ActivityCallout title="Bottle with holes (p.99)">
        Open and close holes at three depths. Deeper water means higher pressure and a longer stream.
      </ActivityCallout>
      {HOLE_LABELS.map((label, i) => (
        <Checkbox key={label} label={`${label} open`} checked={open[i]} onChange={(v) => setHole(i, v)} />
      ))}
      <ReadoutBadge
        label="Longest open stream"
        value={
          open.some(Boolean)
            ? `${Math.max(...open.map((o, i) => (o ? streamLength(i) : 0))).toFixed(0)} px`
            : 'None open'
        }
      />
      {(exploreMode || open.every(Boolean)) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  const holeYs = [70, 120, 170]

  return (
    <SimulationShell
      simId="water-pressure-depth"
      unitId="unit-08"
      unitNumber={8}
      title="Water Pressure and Depth"
      slo={[
        'Relate water pressure to depth in a liquid.',
        'Predict which hole produces the longest stream.',
      ]}
      bookPage={99}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setOpen([false, false, false])
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%', display: 'grid', gap: '0.75rem', alignContent: 'center' }}>
        <svg viewBox="0 0 420 260" width="100%" height="240" role="img" aria-label="Bottle with three holes">
          <rect x="40" y="30" width="120" height="200" rx="12" fill="#bae6fd" stroke="#0284c7" strokeWidth="4" />
          <rect x="70" y="18" width="60" height="20" rx="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
          {Array.from({ length: HOLE_COUNT }, (_, i) => {
            const y = holeYs[i]
            const len = streamLength(i)
            return (
              <g key={i}>
                <circle cx="160" cy={y} r="5" fill={open[i] ? '#0ea5e9' : '#64748b'} />
                {open[i] ? (
                  <path
                    d={`M 160 ${y} Q ${160 + len * 0.45} ${y + 8 + i * 6}, ${160 + len} ${y + 28 + i * 10}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                ) : null}
                <text x="180" y={y + 4} fill="#5a6b7f" fontSize="11">
                  {holeDepthLabel(i)}
                </text>
              </g>
            )
          })}
          <text x="48" y="248" fill="#5a6b7f" fontSize="12">
            Deeper hole → longer jet
          </text>
        </svg>
      </div>
    </SimulationShell>
  )
}
