import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, Checkbox, ReadoutBadge } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { STEAM_BUILDS, emptyChecklist, progress, type BuildId } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'tick',
    label: 'Tick builds',
    detail: 'Check off projects as you plan or complete them (bioplastic, soap, …).',
  },
  {
    id: 'all',
    label: 'Full set',
    detail: 'Reach 5/5 on the checklist, then open Recap.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'STEAM projects connect science ideas to real builds (p.137).',
    'Examples: bioplastic, soap, solar cooker, wind turbine, and a UPS model.',
  ],
  quiz: {
    question: 'A solar cooker mainly uses…',
    choices: ['Reflected sunlight for heat', 'Only chemical fuel', 'Nuclear reactors'],
    correctIndex: 0,
  },
}

export function SteamBuildsSim() {
  const [checked, setChecked] = useState(emptyChecklist)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const prog = progress(checked)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && prog.done >= 1) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && prog.complete) setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, prog.done, prog.complete, setGuidedStepIndex, setRecapOpen])

  const toggle = (id: BuildId, v: boolean) => setChecked((c) => ({ ...c, [id]: v }))

  const controls = (
    <>
      <ActivityCallout title="STEAM builds (p.137)">
        Track five classroom builds. Progress updates as you tick each one.
      </ActivityCallout>
      <ReadoutBadge label="Progress" value={`${prog.done} / ${prog.total}`} />
      <ReadoutBadge label="Percent" value={`${prog.percent}%`} />
      {(exploreMode || prog.complete) && (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      )}
    </>
  )

  return (
    <SimulationShell
      simId="steam-builds"
      unitId="unit-11"
      unitNumber={11}
      title="STEAM Builds Checklist"
      slo={[
        'List five STEAM project builds from the unit.',
        'Track completion progress on a simple checklist.',
      ]}
      bookPage={137}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setChecked(emptyChecklist())
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
        <div
          style={{
            height: 12,
            borderRadius: 6,
            background: '#e2e8f0',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={prog.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${prog.percent}%`, height: '100%', background: '#0ea5e9', transition: 'width 0.2s' }} />
        </div>
        {STEAM_BUILDS.map((b) => (
          <div key={b.id}>
            <Checkbox label={b.label} checked={checked[b.id]} onChange={(v) => toggle(b.id, v)} />
            <p style={{ margin: '0 0 0 1.75rem', fontSize: 13, color: '#5a6b7f' }}>{b.hint}</p>
          </div>
        ))}
      </div>
    </SimulationShell>
  )
}
