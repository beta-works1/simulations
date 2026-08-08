import { useEffect, useState } from 'react'
import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'
import { SimulationShell } from '../../../shell/SimulationShell'
import { ActivityCallout, ReadoutBadge, ToggleSwitch } from '../../../ui'
import { useGs8Flow } from '../../shared/useGs8Flow'
import { evaluateCircuit } from './model'

const GUIDED: GuidedStep[] = [
  {
    id: 'build',
    label: 'Close the circuit',
    detail: 'Turn the cell on, keep the bulb, and close the switch.',
  },
  {
    id: 'read',
    label: 'Read V and I',
    detail: 'Voltage should be 1.5 V and current I = V/R with R = 3 Ω.',
  },
  {
    id: 'open',
    label: 'Open the switch',
    detail: 'Open the switch — current drops to zero even if the cell is on.',
  },
]

const RECAP: RecapContent = {
  keyPoints: [
    'Current flows only in a closed circuit with a power source.',
    'For a simple series bulb, I = V/R (here R = 3 Ω, V = 1.5 V).',
  ],
  quiz: {
    question: 'With the cell on and switch open, the current in the bulb is…',
    choices: ['0.5 A', '1.5 A', '0 A'],
    correctIndex: 2,
  },
}

export function CircuitBuilderSim() {
  const [cellOn, setCellOn] = useState(true)
  const [switchClosed, setSwitchClosed] = useState(false)
  const [bulbPresent, setBulbPresent] = useState(true)
  const {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  } = useGs8Flow()
  const circuit = evaluateCircuit(cellOn, switchClosed, bulbPresent)

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && circuit.currentFlows) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && circuit.currentFlows) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && cellOn && !switchClosed) setRecapOpen(true)
  }, [
    exploreMode,
    guidedStepIndex,
    circuit.currentFlows,
    cellOn,
    switchClosed,
    setGuidedStepIndex,
    setRecapOpen,
  ])

  const controls = (
    <>
      <ActivityCallout title="Circuit builder (p.126)">
        Toggle cell, switch, and bulb. Current flows only on a closed path.
      </ActivityCallout>
      <ToggleSwitch label="Cell on" checked={cellOn} onChange={setCellOn} />
      <ToggleSwitch label="Switch closed" checked={switchClosed} onChange={setSwitchClosed} />
      <ToggleSwitch label="Bulb in circuit" checked={bulbPresent} onChange={setBulbPresent} />
      <ReadoutBadge label="Voltage" value={`${circuit.voltage.toFixed(1)} V`} />
      <ReadoutBadge label="Current" value={`${circuit.current.toFixed(2)} A`} />
      <ReadoutBadge label="Current flows?" value={circuit.currentFlows ? 'Yes' : 'No'} />
      {(exploreMode || guidedStepIndex >= 2) && (
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
      simId="circuit-builder"
      unitId="unit-10"
      unitNumber={10}
      title="Circuit Builder"
      slo={[
        'Build a simple series circuit with cell, switch, and bulb.',
        'Relate closed/open paths to whether current flows; read V and I.',
      ]}
      bookPage={126}
      guidedSteps={GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={RECAP}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setCellOn(true)
        setSwitchClosed(false)
        setBulbPresent(true)
        resetFlow()
      }}
      controls={controls}
    >
      <div style={{ padding: '1.25rem', height: '100%' }}>
        <svg viewBox="0 0 420 240" width="100%" height="100%" role="img" aria-label="Simple series circuit">
          <rect x="0" y="0" width="420" height="240" fill="#f8fafc" />
          {/* Wire loop */}
          <polyline
            points="80,60 340,60 340,180 80,180 80,60"
            fill="none"
            stroke={circuit.currentFlows ? '#f59e0b' : '#94a3b8'}
            strokeWidth="4"
          />
          {/* Cell */}
          <line x1="70" y1="100" x2="70" y2="140" stroke="#152033" strokeWidth="6" />
          <line x1="90" y1="110" x2="90" y2="130" stroke="#152033" strokeWidth="3" />
          <text x="48" y="90" fontSize="12" fill={cellOn ? '#15803d' : '#64748b'}>
            Cell {cellOn ? 'ON' : 'OFF'}
          </text>
          {/* Switch */}
          <line
            x1="200"
            y1="60"
            x2={switchClosed ? 240 : 230}
            y2={switchClosed ? 60 : 40}
            stroke="#0f172a"
            strokeWidth="4"
          />
          <circle cx="200" cy="60" r="5" fill="#0f172a" />
          <circle cx="240" cy="60" r="5" fill="#0f172a" />
          <text x="198" y="32" fontSize="12" fill="#475569">
            Switch {switchClosed ? 'closed' : 'open'}
          </text>
          {/* Bulb */}
          {bulbPresent && (
            <>
              <circle
                cx="340"
                cy="120"
                r="22"
                fill={circuit.currentFlows ? '#fef08a' : '#e2e8f0'}
                stroke="#ca8a04"
                strokeWidth="3"
              />
              <text x="326" y="124" fontSize="11" fill="#713f12">
                Bulb
              </text>
            </>
          )}
          <text x="120" y="220" fontSize="14" fill="#152033">
            V = {circuit.voltage.toFixed(1)} V · I = {circuit.current.toFixed(2)} A
            {circuit.currentFlows ? ' · current flowing' : ''}
          </text>
        </svg>
      </div>
    </SimulationShell>
  )
}
