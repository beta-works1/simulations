import { useMemo, useState } from 'react'
import { SimulationShell } from '../../shell/SimulationShell'
import { ActivityCallout, DraggableToken, ReadoutBadge, Slider } from '../../ui'

const TRACK_Y = 160
const TRACK_LEFT = 40
const TRACK_WIDTH = 320

export function ReferenceDemoSim() {
  const [pos, setPos] = useState(0.35)
  const [token, setToken] = useState({ x: TRACK_LEFT + TRACK_WIDTH * 0.35, y: TRACK_Y - 24 })
  const [guidedStepIndex, setGuidedStepIndex] = useState(0)
  const [exploreMode, setExploreMode] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)

  const guidedSteps = useMemo(
    () => [
      {
        id: 'drag',
        label: 'Drag the ball',
        detail: 'Drag the blue ball along the track (or use the slider).',
      },
      {
        id: 'slider',
        label: 'Finish with the slider',
        detail: 'Move the position slider to about 80%, then open Recap.',
      },
    ],
    [],
  )

  const setPosition = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next))
    setPos(clamped)
    setToken({ x: TRACK_LEFT + TRACK_WIDTH * clamped, y: TRACK_Y - 24 })
    if (!exploreMode && guidedStepIndex === 0 && clamped > 0.1) setGuidedStepIndex(1)
    if (!exploreMode && guidedStepIndex === 1 && clamped >= 0.78) setRecapOpen(true)
  }

  const controls = (
    <>
      <ActivityCallout title="Activity Demo.1">
        This throwaway scene only proves the shell. Real curriculum sims start in Phase 1.
      </ActivityCallout>
      <Slider
        label="Ball position"
        min={0}
        max={100}
        value={Math.round(pos * 100)}
        unit="%"
        onChange={(v) => setPosition(v / 100)}
      />
      <ReadoutBadge label="Normalized x" value={pos.toFixed(2)} />
      {!exploreMode && guidedStepIndex >= 1 ? (
        <button type="button" className="gs8-btn" style={{ marginTop: '0.75rem', width: '100%' }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      ) : null}
    </>
  )

  return (
    <SimulationShell
      simId="reference-demo"
      unitId="unit-09"
      unitNumber={9}
      title="Reference Demo — Ball on a Track"
      slo={[
        'Prove the GS8 shell: drag a token, move a slider, complete Guided Steps, open Recap.',
      ]}
      bookPage={0}
      guidedSteps={guidedSteps}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={{
        keyPoints: ['The shell chrome is shared by every future simulation.'],
        quiz: {
          question: 'Where do you reset a simulation?',
          choices: ['The bottom bar Reset button', 'Refresh the whole website only', 'There is no reset'],
          correctIndex: 0,
        },
      }}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setPosition(0.35)
        setGuidedStepIndex(0)
        setExploreMode(false)
        setRecapOpen(false)
      }}
      controls={controls}
    >
      <div
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280 }}
        data-testid="reference-demo-canvas"
      >
        <svg width="100%" height="100%" viewBox="0 0 420 280" role="img" aria-label="Ball on a track">
          <line
            x1={TRACK_LEFT}
            y1={TRACK_Y}
            x2={TRACK_LEFT + TRACK_WIDTH}
            y2={TRACK_Y}
            stroke="#64748b"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <text x={TRACK_LEFT} y={TRACK_Y + 28} fill="#5a6b7f" fontSize="12">
            Track
          </text>
        </svg>
        <DraggableToken
          id="ball"
          label="Ball"
          x={token.x}
          y={token.y}
          onMove={(x) => {
            const next = (x - TRACK_LEFT) / TRACK_WIDTH
            setPosition(next)
            if (!exploreMode) setGuidedStepIndex(0)
          }}
        />
      </div>
    </SimulationShell>
  )
}
