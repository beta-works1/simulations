import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlPanel,
  ControlStat,
  ControlStats,
  InfoTooltip,
  PlayPauseStepButton,
  ResetButton,
  Slider,
  ToggleSwitch,
} from '../../shared/Controls'
import { drawBadge, drawLegend, fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
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

export function CarbonOxygenCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CarbonOxygenState>(createCarbonOxygenState())
  const particlesRef = useRef<GasParticle[]>([])
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)
  const [ui, setUi] = useState(() => snapshot(stateRef.current))

  useEffect(() => {
    const id = window.setInterval(() => {
      setUi(snapshot(stateRef.current))
    }, 100)
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
    syncFromState()
    setTick((n) => n + 1)
  }

  const stepOnce = () => {
    stateRef.current = stepCarbonOxygen(stateRef.current, 0.05)
    syncFromState()
    setTick((n) => n + 1)
  }

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      let s = stateRef.current
      if (dt > 0 && running) {
        s = stepCarbonOxygen(s, Math.min(dt, 0.05))
        stateRef.current = s
      }

      const rates = computeRates(s)
      const sceneH = h * 0.62
      const chartY = sceneH + 6
      const chartH = h - chartY - 8

      drawLandscape(ctx, w, sceneH, s, rates)
      updateAndDrawParticles(ctx, particlesRef.current, w, sceneH, s, rates, dt)
      drawAtmosphereGauge(ctx, w, sceneH, s)
      drawEquationPanel(ctx, w, sceneH, s)
      drawGasChart(ctx, 10, chartY, w - 20, chartH, s)
      drawProcessLabels(ctx, w, sceneH, rates, s)

      if (s.takeaway) {
        drawTakeaway(ctx, w, sceneH, s.takeaway)
      }

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
      subtitle="How photosynthesis and respiration balance gases — and how humans disrupt them"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={reset}
      hidePlay
      controls={
        <>
          <ControlPanel title="Transport">
            <PlayPauseStepButton
              running={running}
              onToggle={() => setRunning((r) => !r)}
              onStep={stepOnce}
            />
            <ResetButton onReset={reset} />
          </ControlPanel>

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
              label="Forest cover (plants)"
              value={ui.plantCount}
              min={0}
              max={20}
              step={1}
              display={String(Math.round(ui.plantCount))}
              onChange={(v) => patch({ plantCount: v, scenarioProgress: null, scenarioFrom: null })}
            />
            <Slider
              label="Factories / vehicles"
              value={ui.factoryVehicleCount}
              min={0}
              max={20}
              step={1}
              display={String(Math.round(ui.factoryVehicleCount))}
              onChange={(v) =>
                patch({ factoryVehicleCount: v, scenarioProgress: null, scenarioFrom: null })
              }
            />
          </ControlPanel>

          <ControlPanel title="Atmosphere">
            <ControlStats>
              <ControlStat label="CO₂" value={ui.co2Level.toFixed(0)} />
              <ControlStat label="O₂" value={ui.o2Level.toFixed(0)} />
            </ControlStats>
            <ControlHint>
              Numbers are a simplified teaching scale (not real ppm). Watch the chart for trends.
            </ControlHint>
          </ControlPanel>

          <ControlPanel title="Processes">
            <ProcessTip
              title="Photosynthesis"
              body="Green plants use sunlight to change carbon dioxide and water into food (glucose) and oxygen."
            />
            <ProcessTip
              title="Respiration"
              body="Plants, animals, and decomposers use oxygen to break down food and release energy, carbon dioxide, and water."
            />
            <ProcessTip
              title="Decomposition"
              body="When plants and animals die, bacteria and fungi break them down and release carbon dioxide."
            />
            <ProcessTip
              title="Combustion"
              body="Burning wood or fossil fuels uses oxygen and releases carbon dioxide into the air."
            />
          </ControlPanel>

          <ControlPanel title="Human impact">
            <ControlHint>
              Watch CO₂ climb and O₂ fall as forests shrink and industry grows.
            </ControlHint>
            <button
              type="button"
              className="sim-shell-btn is-primary"
              onClick={() => {
                stateRef.current = startDeforestationScenario(stateRef.current)
                setRunning(true)
                syncFromState()
                setTick((n) => n + 1)
              }}
            >
              Simulate Deforestation + Industry
            </button>
            {ui.takeaway ? <ControlHint>{ui.takeaway}</ControlHint> : null}
          </ControlPanel>
        </>
      }
    />
  )
}

function ProcessTip({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <InfoTooltip title={title}>
        <p>{body}</p>
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

/* ─── Drawing ─────────────────────────────────────────────────────────── */

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: CarbonOxygenState,
  rates: ProcessRates,
) {
  const day = s.isDay
  const sun = s.sunlightIntensity / 100

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7)
  if (day) {
    sky.addColorStop(0, mixHex('#87ceeb', '#1a2744', 1 - sun * 0.5))
    sky.addColorStop(1, mixHex('#c5e8b8', '#3d4a5c', 1 - sun * 0.4))
  } else {
    sky.addColorStop(0, '#0b1628')
    sky.addColorStop(1, '#1e2f45')
  }
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Sun / moon
  const orbX = w * 0.82
  const orbY = h * 0.16
  if (day) {
    ctx.beginPath()
    ctx.arc(orbX, orbY, 22 + sun * 6, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 210, 60, ${0.55 + sun * 0.45})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(orbX, orbY, 14 + sun * 4, 0, Math.PI * 2)
    ctx.fillStyle = '#ffe066'
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(orbX, orbY, 14, 0, Math.PI * 2)
    ctx.fillStyle = '#e8eef8'
    ctx.fill()
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 97) % w) + 8
      const sy = ((i * 53) % (h * 0.35)) + 6
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(sx, sy, 1.5, 1.5)
    }
  }

  // Ground
  const groundY = h * 0.72
  const ground = ctx.createLinearGradient(0, groundY, 0, h)
  ground.addColorStop(0, day ? '#5a8f3d' : '#2d4a28')
  ground.addColorStop(1, day ? '#3d6b2e' : '#1a2e18')
  ctx.fillStyle = ground
  ctx.fillRect(0, groundY, w, h - groundY)

  // Soil / decomposers strip
  ctx.fillStyle = day ? 'rgba(92, 64, 40, 0.55)' : 'rgba(40, 28, 18, 0.7)'
  ctx.fillRect(0, h * 0.88, w, h * 0.12)
  if (rates.decomposition > 0.2) {
    ctx.fillStyle = 'rgba(214, 137, 16, 0.35)'
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(w * (0.1 + i * 0.1), h * 0.93, 3 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Trees
  const treeN = Math.round(s.plantCount)
  for (let i = 0; i < treeN; i++) {
    const x = w * (0.08 + (i / Math.max(1, treeN)) * 0.45 + (i % 3) * 0.02)
    const y = groundY + 4
    drawTree(ctx, x, y, day, rates.photosynthesis > 0.3)
  }

  // Animals
  const animalN = Math.round(s.animalPopulation)
  for (let i = 0; i < animalN; i++) {
    const x = w * (0.12 + (i / Math.max(1, animalN)) * 0.4)
    const y = groundY - 6
    drawAnimal(ctx, x, y, day)
  }

  // Factories
  const facN = Math.round(s.factoryVehicleCount)
  for (let i = 0; i < Math.min(facN, 10); i++) {
    const x = w * (0.58 + (i / 10) * 0.36)
    drawFactory(ctx, x, groundY, day, rates.combustion > 0.5)
  }
  if (facN > 10) {
    // Extra vehicles as small rectangles
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
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  day: boolean,
  glowing: boolean,
) {
  ctx.fillStyle = '#6d4c2f'
  ctx.fillRect(x - 3, groundY - 28, 6, 28)
  ctx.beginPath()
  ctx.arc(x, groundY - 36, 16, 0, Math.PI * 2)
  ctx.fillStyle = glowing ? (day ? '#2ecc71' : '#1e8449') : day ? '#27ae60' : '#145a32'
  ctx.fill()
  if (glowing && day) {
    ctx.beginPath()
    ctx.arc(x, groundY - 36, 20, 0, Math.PI * 2)
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
  smoking: boolean,
) {
  ctx.fillStyle = day ? '#7f8c8d' : '#4a5557'
  ctx.fillRect(x - 14, groundY - 36, 28, 36)
  ctx.fillStyle = day ? '#95a5a6' : '#5d6d6e'
  ctx.fillRect(x + 4, groundY - 52, 8, 16)
  if (smoking) {
    ctx.fillStyle = 'rgba(80,80,80,0.45)'
    ctx.beginPath()
    ctx.arc(x + 8, groundY - 62, 7, 0, Math.PI * 2)
    ctx.arc(x + 14, groundY - 72, 9, 0, Math.PI * 2)
    ctx.fill()
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
) {
  const groundY = h * 0.72
  const skyY = h * 0.2
  const spawnBudget = Math.min(8, 2 + Math.floor(dt * 60))

  // Photosynthesis → O₂ rising from trees
  if (rates.photosynthesis > 0.15) {
    for (let i = 0; i < spawnBudget && Math.random() < rates.photosynthesis * 0.08; i++) {
      const tx = w * (0.1 + Math.random() * 0.45)
      particles.push({
        x: tx,
        y: groundY - 40,
        vx: (Math.random() - 0.5) * 10,
        vy: -20 - Math.random() * 25,
        life: 1,
        kind: 'o2',
        source: 'photo',
      })
    }
  }

  // Respiration → CO₂ from animals / plants
  if (rates.respiration > 0.1) {
    for (let i = 0; i < spawnBudget && Math.random() < rates.respiration * 0.12; i++) {
      particles.push({
        x: w * (0.1 + Math.random() * 0.5),
        y: groundY - 10,
        vx: (Math.random() - 0.5) * 8,
        vy: -12 - Math.random() * 18,
        life: 1,
        kind: 'co2',
        source: 'resp',
      })
    }
  }

  // Decomposition → CO₂ from soil
  if (rates.decomposition > 0.15) {
    for (let i = 0; i < 2 && Math.random() < rates.decomposition * 0.2; i++) {
      particles.push({
        x: w * (0.15 + Math.random() * 0.4),
        y: h * 0.9,
        vx: (Math.random() - 0.5) * 6,
        vy: -8 - Math.random() * 10,
        life: 1,
        kind: 'co2',
        source: 'decomp',
      })
    }
  }

  // Combustion → CO₂ from factories
  if (rates.combustion > 0.2) {
    for (let i = 0; i < spawnBudget && Math.random() < rates.combustion * 0.1; i++) {
      particles.push({
        x: w * (0.6 + Math.random() * 0.32),
        y: groundY - 55,
        vx: (Math.random() - 0.5) * 12,
        vy: -18 - Math.random() * 22,
        life: 1.1,
        kind: 'co2',
        source: 'burn',
      })
    }
  }

  // Cap particle count
  while (particles.length > 120) particles.shift()

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

function drawAtmosphereGauge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: CarbonOxygenState,
) {
  const gx = 12
  const gy = 56
  const gw = Math.min(140, w * 0.28)
  const gh = 14

  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  roundRect(ctx, gx - 4, gy - 22, gw + 8, 58, 8)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = `600 ${fontPx(11, w, h)}px Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('Atmosphere', gx, gy - 8)

  // CO₂ bar
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, gx, gy, gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#e74c3c'
  roundRect(ctx, gx, gy, (s.co2Level / 100) * gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `${fontPx(10, w, h)}px Roboto, sans-serif`
  ctx.fillText(`CO₂ ${s.co2Level.toFixed(0)}`, gx + 4, gy + 11)

  // O₂ bar
  const gy2 = gy + gh + 6
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, gx, gy2, gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#27ae60'
  roundRect(ctx, gx, gy2, (s.o2Level / 100) * gw, gh, 4)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(`O₂ ${s.o2Level.toFixed(0)}`, gx + 4, gy2 + 11)
}

function drawEquationPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: CarbonOxygenState,
) {
  const active = activeEquation(s)
  const panelW = Math.min(320, w * 0.48)
  const px = w - panelW - 10
  const py = 10
  const ph = 72

  ctx.fillStyle = 'rgba(11, 28, 44, 0.88)'
  roundRect(ctx, px, py, panelW, ph, 8)
  ctx.fill()

  const fs = fontPx(10, w, h, 9, 12)
  ctx.font = `${fs}px Roboto, sans-serif`
  ctx.textAlign = 'left'

  const row1 = active === 'photosynthesis'
  ctx.fillStyle = row1 ? 'rgba(39, 174, 96, 0.35)' : 'transparent'
  if (row1) {
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
  ctx.fillStyle = row2 ? 'rgba(231, 76, 60, 0.3)' : 'transparent'
  if (row2) {
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
  x: number,
  y: number,
  w: number,
  h: number,
  s: CarbonOxygenState,
) {
  ctx.fillStyle = 'rgba(11,28,44,0.92)'
  roundRect(ctx, x, y, w, h, 8)
  ctx.fill()

  const hist = s.history
  if (hist.length > 1) {
    const plot = (key: 'co2' | 'o2', color: string) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      hist.forEach((p, i) => {
        const px = x + 6 + (i / Math.max(1, hist.length - 1)) * (w - 12)
        const py = y + h - 8 - (p[key] / 100) * (h - 16)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
    }
    plot('co2', '#e74c3c')
    plot('o2', '#2ecc71')
  }

  drawLegend(
    ctx,
    [
      { color: '#e74c3c', label: `CO₂ ${s.co2Level.toFixed(0)}` },
      { color: '#2ecc71', label: `O₂ ${s.o2Level.toFixed(0)}` },
    ],
    x + 10,
    y + 14,
    fontPx(11, w, h, 10, 13),
  )
}

function drawProcessLabels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rates: ProcessRates,
  s: CarbonOxygenState,
) {
  const fs = fontPx(10, w, h, 9, 12)
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.textAlign = 'center'

  const items: { label: string; x: number; y: number; on: boolean; color: string }[] = [
    {
      label: 'Photosynthesis',
      x: w * 0.28,
      y: h * 0.48,
      on: rates.photosynthesis > 0.2,
      color: '#2ecc71',
    },
    {
      label: 'Respiration',
      x: w * 0.28,
      y: h * 0.62,
      on: rates.respiration > 0.15,
      color: '#e67e22',
    },
    {
      label: 'Decomposition',
      x: w * 0.22,
      y: h * 0.94,
      on: rates.decomposition > 0.2,
      color: '#d68910',
    },
    {
      label: 'Combustion',
      x: w * 0.75,
      y: h * 0.42,
      on: rates.combustion > 0.3,
      color: '#c0392b',
    },
  ]

  for (const it of items) {
    if (!it.on) continue
    ctx.fillStyle = it.color
    ctx.globalAlpha = 0.9
    ctx.fillText(it.label, it.x, it.y)
    ctx.globalAlpha = 1
  }

  if (!s.isDay) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = `${fs}px Roboto, sans-serif`
    ctx.fillText('Night — photosynthesis paused', w * 0.28, h * 0.2)
  }
}

function drawTakeaway(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const tw = Math.min(w - 24, 420)
  const tx = (w - tw) / 2
  const ty = h * 0.55
  ctx.fillStyle = 'rgba(192, 57, 43, 0.92)'
  roundRect(ctx, tx, ty, tw, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${fontPx(11, w, h, 10, 13)}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(text.length > 70 ? text.slice(0, 67) + '…' : text, w / 2, ty + 22)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
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
