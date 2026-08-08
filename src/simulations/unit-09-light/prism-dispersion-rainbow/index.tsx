import { useEffect, useMemo, useState } from 'react'
import { SimulationShell } from '../../../shell/SimulationShell'
import { Checkbox, ReadoutBadge, Slider, ToggleSwitch } from '../../../ui'
import { useLocalizedRecap } from '../../../i18n/useLocalizedRecap'
import {
  AIR_N,
  SPECTRUM,
  WATER_N,
  fromAngleDeg,
  incidenceAngleDeg,
  normalize,
  reflect,
  refract,
  type Vec2,
} from '../../../engine/rayTracing'
import { PRISM_GUIDED, PRISM_RECAP, PRISM_SLO } from './content'

type Mode = 'Prism' | 'Rainbow'

function PrismCanvas({
  angleDeg,
  showNormal,
  showAngles,
}: {
  angleDeg: number
  showNormal: boolean
  showAngles: boolean
}) {
  // Prism triangle in viewBox 0..420 x 0..280
  const A = { x: 210, y: 60 }
  const B = { x: 120, y: 210 }
  const C = { x: 300, y: 210 }
  const hit = { x: 150, y: 150 } // approximate entry on AB
  const dir = fromAngleDeg(angleDeg)
  const entryNormal = normalize({ x: B.y - A.y, y: -(B.x - A.x) }) // outward-ish for AB
  // Flip so it faces the incoming ray
  const n1 =
    entryNormal.x * dir.x + entryNormal.y * dir.y > 0
      ? { x: -entryNormal.x, y: -entryNormal.y }
      : entryNormal

  const rays = SPECTRUM.map((band) => {
    const inside = refract(dir, n1, AIR_N, band.n)
    if (!inside) return null
    // Second face BC normal
    const n2raw = normalize({ x: C.y - B.y, y: -(C.x - B.x) })
    const n2 = n2raw.x * inside.x + n2raw.y * inside.y > 0 ? { x: -n2raw.x, y: -n2raw.y } : n2raw
    const exit = refract(inside, n2, band.n, AIR_N) ?? inside
    const exitPt = { x: hit.x + inside.x * 90, y: hit.y + inside.y * 90 }
    return { band, exit, exitPt }
  })

  const iAng = incidenceAngleDeg(dir, n1)
  const src = { x: hit.x - dir.x * 110, y: hit.y - dir.y * 110 }

  return (
    <svg viewBox="0 0 420 280" width="100%" height="100%" role="img" aria-label="Prism dispersion">
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="#dbeafe" stroke="#64748b" strokeWidth="2" />
      <line x1={src.x} y1={src.y} x2={hit.x} y2={hit.y} stroke="#f8fafc" strokeWidth="4" />
      <line x1={src.x} y1={src.y} x2={hit.x} y2={hit.y} stroke="#111827" strokeWidth="2" />
      {rays.map((r) =>
        r ? (
          <line
            key={r.band.name}
            x1={r.exitPt.x}
            y1={r.exitPt.y}
            x2={r.exitPt.x + r.exit.x * 100}
            y2={r.exitPt.y + r.exit.y * 100}
            stroke={r.band.color}
            strokeWidth="3"
          />
        ) : null,
      )}
      {showNormal ? (
        <line
          x1={hit.x - n1.x * 35}
          y1={hit.y - n1.y * 35}
          x2={hit.x + n1.x * 35}
          y2={hit.y + n1.y * 35}
          stroke="#0ea5e9"
          strokeDasharray="4 3"
          strokeWidth="2"
        />
      ) : null}
      {showAngles ? (
        <text x={hit.x - 50} y={hit.y - 18} fill="#152033" fontSize="12" fontWeight="700">
          i ≈ {iAng.toFixed(0)}°
        </text>
      ) : null}
      <circle cx={src.x} cy={src.y} r="8" fill="#fbbf24" stroke="#92400e" />
      <text x="16" y="24" fill="#5a6b7f" fontSize="12">
        White light → prism → ROYGBIV (Fig 9.15)
      </text>
    </svg>
  )
}

function RainbowCanvas({ angleDeg, showNormal, showAngles }: { angleDeg: number; showNormal: boolean; showAngles: boolean }) {
  const cx = 210
  const cy = 140
  const r = 70
  const dir = fromAngleDeg(angleDeg)
  const entry: Vec2 = { x: cx - r * 0.7, y: cy }
  const nIn = normalize({ x: entry.x - cx, y: entry.y - cy })
  const inside = refract(dir, nIn, AIR_N, WATER_N)
  const bounce = inside ? reflect(inside, normalize({ x: 1, y: 0.15 })) : null
  const exitDir = bounce ? refract(bounce, normalize({ x: 0.8, y: -0.4 }), WATER_N, AIR_N) : null
  const iAng = incidenceAngleDeg(dir, nIn)

  return (
    <svg viewBox="0 0 420 280" width="100%" height="100%" role="img" aria-label="Rainbow droplet">
      <circle cx={cx} cy={cy} r={r} fill="#bae6fd" stroke="#0284c7" strokeWidth="3" />
      <line x1={entry.x - dir.x * 90} y1={entry.y - dir.y * 90} x2={entry.x} y2={entry.y} stroke="#111827" strokeWidth="2.5" />
      {inside ? (
        <line
          x1={entry.x}
          y1={entry.y}
          x2={entry.x + inside.x * 95}
          y2={entry.y + inside.y * 95}
          stroke="#64748b"
          strokeWidth="2"
        />
      ) : null}
      {SPECTRUM.map((band, i) => {
        const fan = exitDir ?? { x: 0.9, y: -0.2 }
        const spread = (i - 3) * 0.06
        const fx = fan.x
        const fy = fan.y + spread
        const len = Math.hypot(fx, fy) || 1
        const ox = entry.x + 100
        const oy = entry.y - 20
        return (
          <line
            key={band.name}
            x1={ox}
            y1={oy}
            x2={ox + (fx / len) * 90}
            y2={oy + (fy / len) * 90}
            stroke={band.color}
            strokeWidth="3"
          />
        )
      })}
      {showNormal ? (
        <line
          x1={entry.x - nIn.x * 30}
          y1={entry.y - nIn.y * 30}
          x2={entry.x + nIn.x * 30}
          y2={entry.y + nIn.y * 30}
          stroke="#0ea5e9"
          strokeDasharray="4 3"
        />
      ) : null}
      {showAngles ? (
        <text x={entry.x - 40} y={entry.y - 16} fontSize="12" fontWeight="700" fill="#152033">
          i ≈ {iAng.toFixed(0)}°
        </text>
      ) : null}
      <text x="16" y="24" fill="#5a6b7f" fontSize="12">
        Droplet: refraction → internal reflection → exit spectrum (§9.4.4)
      </text>
    </svg>
  )
}

export function PrismDispersionRainbowSim() {
  const [mode, setMode] = useState<Mode>('Prism')
  const [angle, setAngle] = useState(25)
  const [showNormal, setShowNormal] = useState(false)
  const [showAngles, setShowAngles] = useState(false)
  const [guidedStepIndex, setGuidedStepIndex] = useState(0)
  const [exploreMode, setExploreMode] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [hitPrism, setHitPrism] = useState(false)
  const recap = useLocalizedRecap('prism-dispersion-rainbow', PRISM_RECAP)

  useEffect(() => {
    if (angle >= 18 && angle <= 42) setHitPrism(true)
  }, [angle])

  useEffect(() => {
    if (exploreMode) return
    if (guidedStepIndex === 0 && hitPrism) setGuidedStepIndex(1)
    if (guidedStepIndex === 1 && showNormal) setGuidedStepIndex(2)
    if (guidedStepIndex === 2 && mode === 'Rainbow') setRecapOpen(true)
  }, [exploreMode, guidedStepIndex, hitPrism, showNormal, mode])

  const controls = (
    <>
      <Slider label="Light angle" min={0} max={60} value={angle} unit="°" onChange={setAngle} />
      <ToggleSwitch label="Show normal line" checked={showNormal} onChange={setShowNormal} />
      <Checkbox label="Show angle labels" checked={showAngles} onChange={setShowAngles} />
      <ReadoutBadge label="Mode" value={mode} />
      {(exploreMode || guidedStepIndex >= 2) && mode === 'Rainbow' ? (
        <button type="button" className="gs8-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setRecapOpen(true)}>
          Open Recap
        </button>
      ) : null}
    </>
  )

  const canvas = useMemo(
    () =>
      mode === 'Prism' ? (
        <PrismCanvas angleDeg={angle} showNormal={showNormal} showAngles={showAngles} />
      ) : (
        <RainbowCanvas angleDeg={angle} showNormal={showNormal} showAngles={showAngles} />
      ),
    [mode, angle, showNormal, showAngles],
  )

  return (
    <SimulationShell
      simId="prism-dispersion-rainbow"
      unitId="unit-09"
      unitNumber={9}
      title="Prism Dispersion & Rainbow"
      modes={['Prism', 'Rainbow']}
      activeMode={mode}
      onModeChange={(m) => setMode(m as Mode)}
      slo={PRISM_SLO}
      bookPage={116}
      guidedSteps={PRISM_GUIDED}
      guidedStepIndex={guidedStepIndex}
      onGuidedStepChange={setGuidedStepIndex}
      exploreMode={exploreMode}
      onExploreModeChange={setExploreMode}
      recap={recap}
      recapOpen={recapOpen}
      onRecapOpenChange={setRecapOpen}
      onReset={() => {
        setMode('Prism')
        setAngle(25)
        setShowNormal(false)
        setShowAngles(false)
        setGuidedStepIndex(0)
        setExploreMode(false)
        setRecapOpen(false)
        setHitPrism(false)
      }}
      controls={controls}
    >
      <div style={{ width: '100%', height: '100%', minHeight: 280 }}>{canvas}</div>
    </SimulationShell>
  )
}
