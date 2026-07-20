import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlPanel,
  ControlStat,
  ControlStats,
  InfoTooltip,
  PlayPauseStepButton,
  PresetButton,
  ResetButton,
  Slider,
  ToggleSwitch,
} from '../../shared/Controls'
import { canvasPoint } from '../../shared/canvasCoords'
import { drawBadge, drawLegend, fontPx } from '../../shared/drawHelpers'
import { drawLabelPill } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  activeEquation,
  computeRates,
  createCarbonOxygenState,
  startDeforestationScenario,
  stepCarbonOxygen,
  type CarbonOxygenState,
  type ProcessRates,
} from './carbonOxygenModel'

type GasParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  kind: 'co2' | 'o2'
  source: 'photo' | 'resp' | 'decomp' | 'burn'
}

type HitZone = 'trees' | 'factory' | 'soil' | 'chart'

type Layout = {
  sceneH: number
  groundY: number
  trees: { x: number; y: number; r: number }[]
  factories: { x: number; y: number; w: number; h: number }[]
  soil: { x: number; y: number; w: number; h: number }
  chart: { x: number; y: number; w: number; h: number; padL: number; padB: number }
}

type SceneTip = {
  title: string
  body: string
  equation?: string
}

const TIPS: Record<Exclude<HitZone, 'chart'>, SceneTip> = {
  trees: {
    title: 'Photosynthesis',
    body: 'Green plants use sunlight to change carbon dioxide and water into food (glucose) and oxygen.',
    equation: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',
  },
  factory: {
    title: 'Combustion',
    body: 'Burning wood or fossil fuels uses oxygen and releases carbon dioxide into the air.',
  },
  soil: {
    title: 'Decomposition',
    body: 'When plants and animals die, bacteria and fungi break them down and release carbon dioxide.',
  },
}

export function CarbonOxygenCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CarbonOxygenState>(createCarbonOxygenState())
  const particlesRef = useRef<GasParticle[]>([])
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<HitZone | null>(null)
  const chartHoverXRef = useRef<number | null>(null)
  const visualRef = useRef({
    plants: 12,
    factories: 2,
    co2: 42,
    o2: 58,
    skyBlend: 1,
  })
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)
  const [ui, setUi] = useState(() => snapshot(stateRef.current))
  const [sceneTip, setSceneTip] = useState<SceneTip | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setUi(snapshot(stateRef.current)), 80)
    return () => clearInterval(id)
  }, [])

  const syncFromState = () => setUi(snapshot(stateRef.current))

  const patch = (partial: Partial<CarbonOxygenState>) => {
    stateRef.current = { ...stateRef.current, ...partial }
    syncFromState()
    setTick((n) => n + 1)
  }

  const reset = () => {
    stateRef.current = createCarbonOxygenState()
    particlesRef.current = []
    visualRef.current = { plants: 12, factories: 2, co2: 42, o2: 58, skyBlend: 1 }
    setSceneTip(null)
    hoverRef.current = null
    chartHoverXRef.current = null
    setRunning(true)
    syncFromState()
    setTick((n) => n + 1)
  }

  const stepOnce = () => {
    stateRef.current = stepCarbonOxygen(stateRef.current, 0.05)
    syncFromState()
    setTick((n) => n + 1)
  }

  const runDeforestation = () => {
    stateRef.current = startDeforestationScenario(stateRef.current)
    setRunning(true)
    syncFromState()
    setTick((n) => n + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (pt.y >= L.chart.y && pt.y <= L.chart.y + L.chart.h) return 'chart'
      for (const t of L.trees) {
        if (Math.hypot(pt.x - t.x, pt.y - t.y) < t.r + 8) return 'trees'
      }
      for (const f of L.factories) {
        if (pt.x >= f.x && pt.x <= f.x + f.w && pt.y >= f.y && pt.y <= f.y + f.h) return 'factory'
      }
      const s = L.soil
      if (pt.x >= s.x && pt.x <= s.x + s.w && pt.y >= s.y && pt.y <= s.y + s.h) return 'soil'
      return null
    },
    cursorForHit: () => 'pointer',
    onHoverChange: (id) => {
      hoverRef.current = id as HitZone | null
      if (id === 'trees' || id === 'factory' || id === 'soil') {
        setSceneTip(TIPS[id])
      } else if (id !== 'chart') {
        setSceneTip(null)
      }
      if (id !== 'chart') chartHoverXRef.current = null
    },
    onTap: (id) => {
      if (id === 'trees' || id === 'factory' || id === 'soil') {
        setSceneTip(TIPS[id])
      }
    },
  })

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pt = canvasPoint(canvas, e)
    const L = layoutRef.current
    if (L && pt.y >= L.chart.y && pt.y <= L.chart.y + L.chart.h) {
      chartHoverXRef.current = pt.x
    }
  }

  const onCanvasPointerLeave = () => {
    chartHoverXRef.current = null
  }

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      let s = stateRef.current
      if (dt > 0 && running) {
        s = stepCarbonOxygen(s, Math.min(dt, 0.05))
        stateRef.current = s
      }

      const rates = computeRates(s)
      const vis = visualRef.current
      const ease = 1 - Math.exp(-(dt > 0 ? dt : 0.016) * 6)
      vis.plants += (s.plantCount - vis.plants) * ease
      vis.factories += (s.factoryVehicleCount - vis.factories) * ease
      vis.co2 += (s.co2Level - vis.co2) * ease
      vis.o2 += (s.o2Level - vis.o2) * ease
      const skyTarget = s.isDay ? 0.35 + (s.sunlightIntensity / 100) * 0.65 : 0
      vis.skyBlend += (skyTarget - vis.skyBlend) * ease

      const sceneH = h * 0.58
      const chartY = sceneH + 8
      const chartH = h - chartY - 8
      const chart = { x: 10, y: chartY, w: w - 20, h: chartH, padL: 36, padB: 22 }

      const layout = drawLandscape(ctx, w, sceneH, s, rates, vis)
      layout.chart = chart
      layoutRef.current = layout

      updateAndDrawParticles(ctx, particlesRef.current, w, sceneH, s, rates, dt, vis)
      drawAtmosphereGauge(ctx, w, sceneH, vis)
      drawEquationPanel(ctx, w, sceneH, s)
      drawGasChart(ctx, chart, s, vis, chartHoverXRef.current)
      drawProcessChips(ctx, w, sceneH, rates, s, hoverRef.current)

      if (s.takeaway) drawTakeaway(ctx, w, sceneH, s.takeaway)

      drawBadge(ctx, running ? 'Running' : 'Paused', 10, 16, {
        font: `${fontPx(11, w, h)}px Roboto, sans-serif`,
        bg: running ? 'rgba(39,174,96,0.85)' : 'rgba(0,0,0,0.45)',
      })

      if (s.scenarioProgress !== null) {
        drawBadge(ctx, `Scenario ${Math.round(s.scenarioProgress * 100)}%`, 10, 40, {
          font: `${fontPx(11, w, h)}px Roboto, sans-serif`,
          bg: 'rgba(192,57,43,0.9)',
        })
      }
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, tick, true)

  return (
    <SimShell
      title="Carbon–Oxygen Cycle"
      subtitle="Photosynthesis, respiration, decomposition & combustion — adjust the world and watch the gases"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={reset}
      onPointerMove={onCanvasPointerMove}
      onPointerLeave={onCanvasPointerLeave}
      toolbar={
        <PresetButton onClick={runDeforestation}>Simulate Deforestation + Industry</PresetButton>
      }
      controls={
        <>
          <ControlPanel title="Environment">
            <ToggleSwitch
              label={ui.isDay ? 'Day' : 'Night'}
              checked={ui.isDay}
              onChange={(checked) => patch({ isDay: checked })}
            />
            <Slider
              label="Sunlight"
              value={ui.sunlightIntensity}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={(v) => patch({ sunlightIntensity: v })}
            />
            <Slider
              label="Plant count"
              value={Math.round(ui.plantCount)}
              min={0}
              max={20}
              step={1}
              display={String(Math.round(ui.plantCount))}
              onChange={(v) =>
                patch({ plantCount: v, scenarioProgress: null, scenarioFrom: null })
              }
            />
            <Slider
              label="Factory / vehicle count"
              value={Math.round(ui.factoryVehicleCount)}
              min={0}
              max={20}
              step={1}
              display={String(Math.round(ui.factoryVehicleCount))}
              onChange={(v) =>
                patch({ factoryVehicleCount: v, scenarioProgress: null, scenarioFrom: null })
              }
            />
          </ControlPanel>

          <ControlPanel title="Transport">
            <PlayPauseStepButton
              running={running}
              onToggle={() => setRunning((r) => !r)}
              onStep={stepOnce}
            />
            <ResetButton onReset={reset} />
            <PresetButton onClick={runDeforestation}>Simulate Deforestation + Industry</PresetButton>
            {ui.takeaway ? <ControlHint>{ui.takeaway}</ControlHint> : null}
          </ControlPanel>

          <ControlPanel title="Atmosphere">
            <ControlStats>
              <ControlStat label="CO₂" value={ui.co2Level.toFixed(0)} />
              <ControlStat label="O₂" value={ui.o2Level.toFixed(0)} />
            </ControlStats>
            <ControlHint>
              Hover trees, factory, or soil for process info. Night / low plants / high factories raise
              CO₂.
            </ControlHint>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              <ProcessTip
                title="Photosynthesis"
                body={TIPS.trees.body}
                equation={TIPS.trees.equation}
              />
              <ProcessTip
                title="Respiration"
                body="Living things use O₂ and release CO₂ all the time."
              />
              <ProcessTip title="Decomposition" body={TIPS.soil.body} />
              <ProcessTip title="Combustion" body={TIPS.factory.body} />
            </div>
            {sceneTip ? (
              <ControlHint>
                <strong>{sceneTip.title}:</strong> {sceneTip.body}
              </ControlHint>
            ) : null}
          </ControlPanel>
        </>
      }
    />
  )
}

function ProcessTip({
  title,
  body,
  equation,
}: {
  title: string
  body: string
  equation?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <InfoTooltip title={title}>
        <p>{body}</p>
        {equation ? <p style={{ marginTop: 6 }}>{equation}</p> : null}
      </InfoTooltip>
      <strong style={{ fontSize: 13 }}>{title}</strong>
    </div>
  )
}

function snapshot(s: CarbonOxygenState) {
  return {
    co2Level: s.co2Level,
    o2Level: s.o2Level,
    sunlightIntensity: s.sunlightIntensity,
    isDay: s.isDay,
    plantCount: s.plantCount,
    factoryVehicleCount: s.factoryVehicleCount,
    takeaway: s.takeaway,
    scenarioProgress: s.scenarioProgress,
  }
}

type Visual = {
  plants: number
  factories: number
  co2: number
  o2: number
  skyBlend: number
}

/* ─── Drawing ─────────────────────────────────────────────────────────── */

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: CarbonOxygenState,
  rates: ProcessRates,
  vis: Visual,
): Layout {
  const day = s.isDay
  const blend = vis.skyBlend

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7)
  if (day || blend > 0.05) {
    sky.addColorStop(0, mixHex('#0b1628', '#87ceeb', blend))
    sky.addColorStop(1, mixHex('#1e2f45', '#c5e8b8', blend))
  } else {
    sky.addColorStop(0, '#0b1628')
    sky.addColorStop(1, '#1e2f45')
  }
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Sun / moon — upper-center sky (equation panel is bottom-left)
  const orbX = w * 0.55
  const orbY = h * 0.12
  if (day && blend > 0.15) {
    const sunR = 16 + blend * 10
    ctx.beginPath()
    ctx.arc(orbX, orbY, sunR + 8, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 210, 60, ${0.25 + blend * 0.4})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(orbX, orbY, sunR, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 224, 102, ${0.55 + blend * 0.45})`
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(orbX, orbY, 12, 0, Math.PI * 2)
    ctx.fillStyle = '#e8eef8'
    ctx.fill()
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 97) % w) + 8
      const sy = ((i * 53) % (h * 0.35)) + 6
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(sx, sy, 1.5, 1.5)
    }
  }

  const groundY = h * 0.7
  const ground = ctx.createLinearGradient(0, groundY, 0, h)
  ground.addColorStop(0, mixHex('#2d4a28', '#5a8f3d', blend))
  ground.addColorStop(1, mixHex('#1a2e18', '#3d6b2e', blend))
  ctx.fillStyle = ground
  ctx.fillRect(0, groundY, w, h - groundY)

  const soilY = h * 0.86
  const soilH = h - soilY
  ctx.fillStyle = day ? 'rgba(92, 64, 40, 0.55)' : 'rgba(40, 28, 18, 0.7)'
  ctx.fillRect(0, soilY, w, soilH)
  if (rates.decomposition > 0.2) {
    ctx.fillStyle = 'rgba(214, 137, 16, 0.35)'
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(w * (0.1 + i * 0.1), soilY + soilH * 0.45, 3 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const trees: Layout['trees'] = []
  const treeN = Math.max(0, Math.round(vis.plants))
  for (let i = 0; i < treeN; i++) {
    const x = w * (0.06 + (i / Math.max(1, treeN)) * 0.48 + ((i * 17) % 5) * 0.008)
    const scale = 0.75 + ((i * 37) % 10) / 20
    const tint = (i * 13) % 3
    drawTree(ctx, x, groundY + 4, day, rates.photosynthesis > 0.3, scale, tint)
    trees.push({ x, y: groundY - 28 * scale, r: 18 * scale })
  }

  const animalN = Math.round(s.animalPopulation)
  for (let i = 0; i < animalN; i++) {
    const x = w * (0.1 + (i / Math.max(1, animalN)) * 0.42)
    drawAnimal(ctx, x, groundY - 6, day)
  }

  const factories: Layout['factories'] = []
  const facN = Math.max(0, Math.round(vis.factories))
  const buildingN = Math.min(facN, 10)
  for (let i = 0; i < buildingN; i++) {
    const x = w * (0.58 + (i / Math.max(1, 10)) * 0.36)
    const smoke = rates.combustion * (0.4 + i * 0.05)
    drawFactory(ctx, x, groundY, day, smoke)
    factories.push({ x: x - 16, y: groundY - 56, w: 36, h: 56 })
  }
  for (let i = 10; i < facN; i++) {
    const x = w * (0.55 + ((i - 10) / 10) * 0.4)
    ctx.fillStyle = '#555'
    ctx.fillRect(x, groundY - 8, 14, 6)
    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(x + 3, groundY - 2, 2.5, 0, Math.PI * 2)
    ctx.arc(x + 11, groundY - 2, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  return {
    sceneH: h,
    groundY,
    trees,
    factories,
    soil: { x: 0, y: soilY, w, h: soilH },
    chart: { x: 0, y: 0, w: 0, h: 0, padL: 0, padB: 0 },
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  day: boolean,
  glowing: boolean,
  scale: number,
  tint: number,
) {
  const trunkH = 26 * scale
  const canopyR = 14 * scale + 2
  ctx.fillStyle = '#6d4c2f'
  ctx.fillRect(x - 3 * scale, groundY - trunkH, 6 * scale, trunkH)

  const greens = day
    ? ['#1e8449', '#27ae60', '#2ecc71']
    : ['#0e3d24', '#145a32', '#1a6b3a']
  ctx.beginPath()
  ctx.arc(x, groundY - trunkH - canopyR * 0.35, canopyR, 0, Math.PI * 2)
  ctx.fillStyle = greens[tint % greens.length]
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x - canopyR * 0.45, groundY - trunkH, canopyR * 0.7, 0, Math.PI * 2)
  ctx.arc(x + canopyR * 0.4, groundY - trunkH, canopyR * 0.65, 0, Math.PI * 2)
  ctx.fill()

  if (glowing && day) {
    ctx.beginPath()
    ctx.arc(x, groundY - trunkH - canopyR * 0.2, canopyR + 4, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)'
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

function drawAnimal(ctx: CanvasRenderingContext2D, x: number, y: number, day: boolean) {
  ctx.fillStyle = day ? '#8e5a2b' : '#5c3a1a'
  ctx.beginPath()
  ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + 8, y - 4, 4.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawFactory(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  day: boolean,
  smokeStrength: number,
) {
  ctx.fillStyle = day ? '#7f8c8d' : '#4a5557'
  ctx.fillRect(x - 14, groundY - 36, 28, 36)
  ctx.fillStyle = day ? '#95a5a6' : '#5d6d6e'
  ctx.fillRect(x + 4, groundY - 52, 8, 16)
  if (smokeStrength > 0.15) {
    const puffs = Math.min(4, 1 + Math.floor(smokeStrength))
    for (let i = 0; i < puffs; i++) {
      const a = Math.min(0.55, 0.15 + smokeStrength * 0.12)
      ctx.fillStyle = `rgba(70,70,70,${a})`
      ctx.beginPath()
      ctx.arc(x + 8 + i * 5, groundY - 58 - i * 10, 5 + i * 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: GasParticle[],
  w: number,
  h: number,
  s: CarbonOxygenState,
  rates: ProcessRates,
  dt: number,
  vis: Visual,
) {
  const groundY = h * 0.7
  const skyY = h * 0.15
  const spawnBudget = Math.min(10, 2 + Math.floor(dt * 60))
  const plantFactor = Math.max(0.15, vis.plants / 12)

  if (s.isDay && rates.photosynthesis > 0.1) {
    const chance = rates.photosynthesis * 0.1 * plantFactor * (s.sunlightIntensity / 80)
    for (let i = 0; i < spawnBudget && Math.random() < chance; i++) {
      particles.push({
        x: w * (0.08 + Math.random() * 0.45),
        y: groundY - 40,
        vx: (Math.random() - 0.5) * 10,
        vy: -22 - Math.random() * 28,
        life: 1,
        kind: 'o2',
        source: 'photo',
      })
    }
  }

  if (rates.respiration > 0.1) {
    for (let i = 0; i < spawnBudget && Math.random() < rates.respiration * 0.1; i++) {
      particles.push({
        x: w * (0.1 + Math.random() * 0.45),
        y: groundY - 10,
        vx: (Math.random() - 0.5) * 8,
        vy: -12 - Math.random() * 18,
        life: 1,
        kind: 'co2',
        source: 'resp',
      })
    }
  }

  if (rates.decomposition > 0.12) {
    for (let i = 0; i < 3 && Math.random() < rates.decomposition * 0.25; i++) {
      particles.push({
        x: w * (0.12 + Math.random() * 0.4),
        y: h * 0.9,
        vx: (Math.random() - 0.5) * 6,
        vy: -8 - Math.random() * 10,
        life: 1,
        kind: 'co2',
        source: 'decomp',
      })
    }
  }

  if (rates.combustion > 0.15) {
    const chance = rates.combustion * 0.12 * Math.max(0.2, vis.factories / 8)
    for (let i = 0; i < spawnBudget && Math.random() < chance; i++) {
      particles.push({
        x: w * (0.58 + Math.random() * 0.35),
        y: groundY - 55,
        vx: (Math.random() - 0.5) * 12,
        vy: -20 - Math.random() * 24,
        life: 1.1,
        kind: 'co2',
        source: 'burn',
      })
    }
  }

  while (particles.length > 140) particles.shift()

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt * 0.55
    if (p.life <= 0 || p.y < skyY - 20) {
      particles.splice(i, 1)
      continue
    }
    const alpha = Math.max(0, Math.min(1, p.life))
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.kind === 'o2' ? 4 : 3.5, 0, Math.PI * 2)
    ctx.fillStyle =
      p.kind === 'o2' ? `rgba(46, 204, 113, ${alpha})` : `rgba(231, 76, 60, ${alpha})`
    ctx.fill()
  }
}

function drawAtmosphereGauge(ctx: CanvasRenderingContext2D, w: number, h: number, vis: Visual) {
  const gx = 12
  const gy = 56
  const gw = Math.min(140, w * 0.28)
  const gh = 14

  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  roundRect(ctx, gx - 4, gy - 22, gw + 8, 58, 8)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = `600 ${fontPx(11, w, h)}px Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('Atmosphere', gx, gy - 8)

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, gx, gy, gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#e74c3c'
  roundRect(ctx, gx, gy, (vis.co2 / 100) * gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `${fontPx(10, w, h)}px Roboto, sans-serif`
  ctx.fillText(`CO₂ ${vis.co2.toFixed(0)}`, gx + 4, gy + 11)

  const gy2 = gy + gh + 6
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, gx, gy2, gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#27ae60'
  roundRect(ctx, gx, gy2, (vis.o2 / 100) * gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(`O₂ ${vis.o2.toFixed(0)}`, gx + 4, gy2 + 11)
}

function drawEquationPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: CarbonOxygenState,
) {
  const active = activeEquation(s)
  const panelW = Math.min(280, w * 0.42)
  const px = 10
  // Bottom-left of the scene — clear of the sun (upper-center sky)
  const py = h - 82
  const ph = 72

  ctx.fillStyle = 'rgba(11, 28, 44, 0.9)'
  roundRect(ctx, px, py, panelW, ph, 8)
  ctx.fill()

  const fs = fontPx(10, w, h, 9, 12)
  ctx.font = `${fs}px Roboto, sans-serif`
  ctx.textAlign = 'left'

  const row1 = active === 'photosynthesis'
  if (row1) {
    ctx.fillStyle = 'rgba(39, 174, 96, 0.35)'
    roundRect(ctx, px + 4, py + 6, panelW - 8, 28, 5)
    ctx.fill()
  }
  ctx.fillStyle = row1 ? '#2ecc71' : 'rgba(255,255,255,0.55)'
  ctx.fillText('Photosynthesis', px + 10, py + 18)
  ctx.fillStyle = row1 ? '#ecf0f1' : 'rgba(255,255,255,0.4)'
  ctx.font = `${Math.max(8, fs - 1)}px Roboto, sans-serif`
  ctx.fillText('6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', px + 10, py + 30)

  ctx.font = `${fs}px Roboto, sans-serif`
  const row2 = active === 'respiration'
  if (row2) {
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)'
    roundRect(ctx, px + 4, py + 38, panelW - 8, 28, 5)
    ctx.fill()
  }
  ctx.fillStyle = row2 ? '#e74c3c' : 'rgba(255,255,255,0.55)'
  ctx.fillText('Respiration', px + 10, py + 50)
  ctx.fillStyle = row2 ? '#ecf0f1' : 'rgba(255,255,255,0.4)'
  ctx.font = `${Math.max(8, fs - 1)}px Roboto, sans-serif`
  ctx.fillText('C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy', px + 10, py + 62)
}

function drawGasChart(
  ctx: CanvasRenderingContext2D,
  chart: Layout['chart'],
  s: CarbonOxygenState,
  vis: Visual,
  hoverX: number | null,
) {
  const { x, y, w, h, padL, padB } = chart
  ctx.fillStyle = 'rgba(11,28,44,0.92)'
  roundRect(ctx, x, y, w, h, 8)
  ctx.fill()

  const plotX = x + padL
  const plotY = y + 8
  const plotW = w - padL - 10
  const plotH = h - padB - 10

  // Gridlines + axis labels
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `${fontPx(9, w, h, 8, 11)}px Roboto, sans-serif`
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (i / 4) * plotH
    ctx.beginPath()
    ctx.moveTo(plotX, gy)
    ctx.lineTo(plotX + plotW, gy)
    ctx.stroke()
    ctx.fillText(String(100 - i * 25), plotX - 6, gy + 3)
  }
  ctx.textAlign = 'center'
  ctx.fillText('time →', plotX + plotW / 2, y + h - 6)
  ctx.save()
  ctx.translate(x + 12, plotY + plotH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('gas level', 0, 0)
  ctx.restore()

  const hist = s.history
  if (hist.length > 1) {
    const plot = (key: 'co2' | 'o2', color: string) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2.2
      hist.forEach((p, i) => {
        const px = plotX + (i / Math.max(1, hist.length - 1)) * plotW
        const py = plotY + plotH - (p[key] / 100) * plotH
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
    }
    plot('co2', '#e74c3c')
    plot('o2', '#2ecc71')

    if (hoverX !== null && hoverX >= plotX && hoverX <= plotX + plotW) {
      const t = (hoverX - plotX) / plotW
      const idx = Math.round(t * (hist.length - 1))
      const sample = hist[Math.max(0, Math.min(hist.length - 1, idx))]
      const cx = plotX + (idx / Math.max(1, hist.length - 1)) * plotW
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      ctx.moveTo(cx, plotY)
      ctx.lineTo(cx, plotY + plotH)
      ctx.stroke()
      const tip = `CO₂ ${sample.co2.toFixed(0)}  ·  O₂ ${sample.o2.toFixed(0)}`
      drawLabelPill(ctx, tip, cx, plotY + 14, {
        fontSize: 11,
        bg: 'rgba(0,0,0,0.75)',
        fg: '#fff',
      })
    }
  }

  drawLegend(
    ctx,
    [
      { color: '#e74c3c', label: `CO₂ ${vis.co2.toFixed(0)}` },
      { color: '#2ecc71', label: `O₂ ${vis.o2.toFixed(0)}` },
    ],
    plotX + 8,
    y + 16,
    fontPx(11, w, h, 10, 13),
  )
}

function drawProcessChips(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rates: ProcessRates,
  s: CarbonOxygenState,
  hover: HitZone | null,
) {
  const fs = fontPx(10, w, h, 9, 12)
  const items: { label: string; x: number; y: number; on: boolean; hot: boolean }[] = [
    {
      label: 'Photosynthesis',
      x: w * 0.22,
      y: h * 0.38,
      on: rates.photosynthesis > 0.15,
      hot: hover === 'trees',
    },
    {
      label: 'Respiration',
      x: w * 0.22,
      y: h * 0.52,
      on: rates.respiration > 0.1,
      hot: false,
    },
    {
      label: 'Decomposition',
      x: w * 0.2,
      y: h * 0.82,
      on: rates.decomposition > 0.15,
      hot: hover === 'soil',
    },
    {
      label: 'Combustion',
      x: w * 0.78,
      y: h * 0.36,
      on: rates.combustion > 0.2,
      hot: hover === 'factory',
    },
  ]

  for (const it of items) {
    if (!it.on && !it.hot) continue
    drawLabelPill(ctx, it.label, it.x, it.y, {
      fontSize: fs,
      bg: it.hot ? 'rgba(14,116,144,0.92)' : 'rgba(21,32,51,0.82)',
      fg: '#fff',
      bold: true,
    })
  }

  if (!s.isDay) {
    drawLabelPill(ctx, 'Night — photosynthesis paused', w * 0.42, h * 0.22, {
      fontSize: fs,
      bg: 'rgba(11,22,40,0.85)',
      fg: '#dce6f5',
    })
  }

  if (hover === 'trees' || hover === 'factory' || hover === 'soil') {
    const tip = TIPS[hover]
    const tw = Math.min(w - 24, 340)
    const tx = 12
    const ty = 100
    ctx.fillStyle = 'rgba(11, 28, 44, 0.94)'
    roundRect(ctx, tx, ty, tw, tip.equation ? 70 : 54, 8)
    ctx.fill()
    ctx.fillStyle = '#7dd3fc'
    ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(tip.title, tx + 10, ty + 18)
    ctx.fillStyle = '#e8eef5'
    ctx.font = `${fs}px Roboto, sans-serif`
    wrapText(ctx, tip.body, tx + 10, ty + 36, tw - 20, fs + 2)
    if (tip.equation) {
      ctx.fillStyle = '#a7f3d0'
      ctx.fillText(tip.equation, tx + 10, ty + 60)
    }
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = word
      yy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}

function drawTakeaway(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const tw = Math.min(w - 24, 440)
  const tx = (w - tw) / 2
  const ty = h * 0.48
  ctx.fillStyle = 'rgba(192, 57, 43, 0.92)'
  roundRect(ctx, tx, ty, tw, 40, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${fontPx(11, w, h, 10, 13)}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  const short = text.length > 72 ? `${text.slice(0, 69)}…` : text
  ctx.fillText(short, w / 2, ty + 24)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ww: number,
  hh: number,
  r: number,
) {
  const rr = Math.min(r, ww / 2, hh / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + ww, y, x + ww, y + hh, rr)
  ctx.arcTo(x + ww, y + hh, x, y + hh, rr)
  ctx.arcTo(x, y + hh, x, y, rr)
  ctx.arcTo(x, y, x + ww, y, rr)
  ctx.closePath()
}

function mixHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  const u = Math.max(0, Math.min(1, t))
  const r = Math.round(pa.r + (pb.r - pa.r) * u)
  const g = Math.round(pa.g + (pb.g - pa.g) * u)
  const bl = Math.round(pa.b + (pb.b - pa.b) * u)
  return `rgb(${r},${g},${bl})`
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}
