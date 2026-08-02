import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ControlHint,
  ControlPanel,
  ControlSection,
  ControlStack,
  PlayPauseStepButton,
  PresetButton,
  ResetButton,
  Slider,
  ToggleSwitch,
} from '../../shared/Controls'
import { drawBadge, drawLegend, fontPx, roundRect } from '../../shared/drawHelpers'
import { drawLabelPill } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  AGENT_ART,
  createEmitAcc,
  drawAgent,
  drawLandscape,
  emitGases,
  makeClouds,
  stepAndDrawParticles,
  type GasParticle,
} from './carbonOxygenGraphics'
import {
  AGENT_LIMITS,
  CYCLE_STEPS,
  addAgent,
  animalCount,
  applyChallenge,
  balanceStatus,
  computeRates,
  createCarbonOxygenState,
  factoryCount,
  moveAgent,
  plantCount,
  removeAgent,
  setAgentCounts,
  setCycleStep,
  stepCarbonOxygen,
  triadForState,
  type AgentKind,
  type CarbonOxygenState,
} from './carbonOxygenModel'
import './CarbonOxygenCycleSim.css'

type LandGeom = { left: number; top: number; width: number; height: number }

function landGeom(w: number, h: number): LandGeom {
  return {
    left: w * 0.22,
    top: h * 0.38,
    width: w * 0.58,
    height: h * 0.48,
  }
}

function toLocal(land: LandGeom, a: { nx: number; ny: number }) {
  return { x: land.left + a.nx * land.width, y: land.top + a.ny * land.height }
}

function toNorm(land: LandGeom, x: number, y: number) {
  return {
    nx: (x - land.left) / land.width,
    ny: (y - land.top) / land.height,
  }
}

function inLand(land: LandGeom, x: number, y: number) {
  return (
    x >= land.left && x <= land.left + land.width && y >= land.top && y <= land.top + land.height
  )
}

export function CarbonOxygenCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CarbonOxygenState>(createCarbonOxygenState())
  const particlesRef = useRef<GasParticle[]>([])
  const emitAccRef = useRef(createEmitAcc())
  const cloudsRef = useRef(makeClouds())
  const lastDragPt = useRef<{ x: number; y: number } | null>(null)
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState(0)
  const [placeKind, setPlaceKind] = useState<AgentKind | null>(null)
  const bump = useCallback(() => setTick((t) => t + 1), [])

  const setState = useCallback(
    (updater: (s: CarbonOxygenState) => CarbonOxygenState) => {
      stateRef.current = updater(stateRef.current)
      bump()
    },
    [bump],
  )

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => bump(), 400)
    return () => window.clearInterval(id)
  }, [running, bump])

  const reset = useCallback(() => {
    stateRef.current = createCarbonOxygenState()
    particlesRef.current = []
    emitAccRef.current = createEmitAcc()
    setPlaceKind(null)
    setRunning(true)
    bump()
  }, [bump])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const clampedDt = Math.min(dt, 0.05)
      const s = stateRef.current
      if (running) {
        stateRef.current = stepCarbonOxygen(s, clampedDt)
      }
      const st = stateRef.current
      const rates = computeRates(st)
      const land = landGeom(w, h)
      const groundY = h * 0.68
      const oceanW = w * 0.22
      const time = st.time

      drawLandscape(
        ctx,
        w,
        h,
        time,
        st.isDay,
        st.sunlightIntensity,
        cloudsRef.current,
        oceanW,
        groundY,
      )

      if (placeKind) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 2
        ctx.setLineDash([7, 5])
        ctx.strokeRect(land.left, land.top, land.width, land.height)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillRect(land.left, land.top, land.width, land.height)
        const pulse = 0.5 + 0.5 * Math.sin(time * 4)
        ctx.strokeStyle = `rgba(74,222,128,${0.35 + pulse * 0.4})`
        ctx.lineWidth = 2.5
        ctx.strokeRect(land.left + 4, land.top + 4, land.width - 8, land.height - 8)
      }

      for (const a of st.agents) {
        const p = toLocal(land, a)
        drawAgent(ctx, a.kind, p.x, p.y, time, a.id, rates, st.isDay)
      }

      const plants = st.agents.filter((a) => a.kind === 'plant').map((a) => toLocal(land, a))
      const animals = st.agents.filter((a) => a.kind === 'animal').map((a) => toLocal(land, a))
      const factories = st.agents.filter((a) => a.kind === 'factory').map((a) => toLocal(land, a))
      const particles = particlesRef.current

      if (running) {
        emitGases(
          particles,
          emitAccRef.current,
          clampedDt,
          time,
          st.isDay,
          rates,
          { plants, animals, factories },
          { w, h, oceanW },
        )
      }
      stepAndDrawParticles(ctx, particles, clampedDt, time, h)

      // Atmosphere gauge
      ctx.fillStyle = 'rgba(15,23,42,0.88)'
      roundRect(ctx, 12, 12, 168, 68, 12)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${fontPx(11, w, h)}px Roboto, system-ui, sans-serif`
      ctx.fillText('Atmosphere', 24, 32)
      const barW = 144
      const drawBar = (y: number, frac: number, color: string, label: string) => {
        ctx.fillStyle = 'rgba(255,255,255,0.12)'
        roundRect(ctx, 24, y, barW, 11, 5)
        ctx.fill()
        const fillW = Math.max(4, frac * barW)
        ctx.fillStyle = color
        roundRect(ctx, 24, y, fillW, 11, 5)
        ctx.fill()
        if (fillW > 12) {
          const shimmer = ((time * 40) % Math.max(1, fillW - 10))
          ctx.fillStyle = 'rgba(255,255,255,0.18)'
          ctx.fillRect(24 + shimmer, y + 1, 8, 9)
        }
        ctx.fillStyle = '#ecf0f1'
        ctx.font = `${fontPx(9, w, h)}px Roboto, system-ui, sans-serif`
        ctx.fillText(label, 28, y + 9)
      }
      drawBar(40, st.co2Level / 100, '#e74c3c', `CO₂ ${st.co2Level.toFixed(0)}%`)
      drawBar(56, st.o2Level / 100, '#27ae60', `O₂ ${st.o2Level.toFixed(0)}%`)

      drawBadge(ctx, running ? 'Live gases' : 'Paused', 12, 98, {
        bg: running ? 'rgba(39,174,96,0.9)' : 'rgba(0,0,0,0.45)',
      })

      const avg = (list: { x: number; y: number }[], fx: number, fy: number) => {
        if (!list.length) return { x: fx, y: fy }
        return {
          x: list.reduce((n, p) => n + p.x, 0) / list.length,
          y: list.reduce((n, p) => n + p.y, 0) / list.length,
        }
      }
      const bob = Math.sin(time * 2.2) * 3
      if (rates.photosynthesis > 0.15) {
        const p = avg(plants, w * 0.4, h * 0.4)
        drawLabelPill(ctx, 'Photosynthesis → O₂', p.x, p.y - 42 + bob)
      }
      if (rates.respiration > 0.1) {
        const p = avg(animals, w * 0.45, h * 0.55)
        drawLabelPill(ctx, 'Breathing → CO₂', p.x, p.y - 34 - bob)
      }
      if (rates.decomposition > 0.15) {
        drawLabelPill(ctx, 'Decay → CO₂', w * 0.52, h * 0.8 + bob * 0.5)
      }
      if (rates.oceanAbsorb > 0.15) {
        drawLabelPill(ctx, 'Ocean absorbs CO₂', oceanW * 0.5, h * 0.7 - bob)
      }
      if (rates.combustion > 0.2) {
        const p = avg(factories, w * 0.7, h * 0.5)
        drawLabelPill(ctx, 'Burning → CO₂', p.x, p.y - 58 + bob)
      }

      const chart = { x: w * 0.28, y: h - 120, w: Math.min(400, w * 0.45), h: 100 }
      ctx.fillStyle = 'rgba(15,23,42,0.82)'
      roundRect(ctx, chart.x, chart.y, chart.w, chart.h, 12)
      ctx.fill()
      ctx.fillStyle = '#bdc3c7'
      ctx.font = `${fontPx(10, w, h)}px Roboto, system-ui, sans-serif`
      ctx.fillText('CO₂ (red) & O₂ (green) over time', chart.x + 14, chart.y + 16)
      const hist = st.history
      if (hist.length > 1) {
        const padL = 36
        const padT = 22
        const padB = 16
        const plotW = chart.w - padL - 10
        const plotH = chart.h - padT - padB
        const x0 = chart.x + padL
        const yBase = chart.y + padT + plotH
        const stroke = (key: 'co2' | 'o2', color: string) => {
          ctx.beginPath()
          ctx.strokeStyle = color
          ctx.lineWidth = 2.5
          ctx.lineJoin = 'round'
          hist.forEach((sample, i) => {
            const x = x0 + (i / (hist.length - 1)) * plotW
            const y = yBase - (sample[key] / 100) * plotH
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
        }
        stroke('co2', '#e74c3c')
        stroke('o2', '#2ecc71')
      }

      drawLegend(
        ctx,
        [
          { color: '#2ecc71', label: 'O₂ rising from trees' },
          { color: '#e74c3c', label: 'CO₂ from breath / burn / decay' },
        ],
        Math.max(12, w - 310),
        16,
        11,
      )

      if (st.takeaway) {
        ctx.fillStyle = 'rgba(192,57,43,0.92)'
        roundRect(ctx, w / 2 - 220, 12, 440, 28, 8)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `${fontPx(11, w, h)}px Roboto, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(st.takeaway, w / 2, 30)
        ctx.textAlign = 'left'
      }
    },
    [running, placeKind],
  )

  useCanvasLoop(canvasRef, draw, running, tick, true)

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const land = landGeom(size.w, size.h)
      const agents = [...stateRef.current.agents].reverse()
      for (const a of agents) {
        const p = toLocal(land, a)
        const r = a.kind === 'factory' ? 32 : a.kind === 'plant' ? 28 : 26
        if ((pt.x - p.x) ** 2 + (pt.y - p.y) ** 2 < r * r) return a.id
      }
      if (pt.x < size.w * 0.22 && pt.y > size.h * 0.62) return 'ocean'
      if (pt.x > size.w * 0.35 && pt.x < size.w * 0.7 && pt.y > size.h * 0.82) return 'soil'
      if (placeKind && inLand(land, pt.x, pt.y)) return 'place'
      return null
    },
    cursorForHit: (id) => {
      if (id === 'ocean' || id === 'soil' || id === 'place') return 'pointer'
      return 'grab'
    },
    onDrag: (id, pt, size) => {
      if (id === 'ocean' || id === 'soil' || id === 'place') return
      lastDragPt.current = pt
      const land = landGeom(size.w, size.h)
      const n = toNorm(land, pt.x, pt.y)
      stateRef.current = moveAgent(stateRef.current, id, n.nx, n.ny, false)
    },
    onDragEnd: (id) => {
      if (!id || id === 'ocean' || id === 'soil' || id === 'place') {
        lastDragPt.current = null
        return
      }
      const canvas = canvasRef.current
      if (!canvas) return
      const parent = canvas.parentElement
      const w = parent?.clientWidth ?? canvas.clientWidth
      const h = parent?.clientHeight ?? canvas.clientHeight
      const land = landGeom(w, h)
      const pt = lastDragPt.current
      lastDragPt.current = null
      const agent = stateRef.current.agents.find((a) => a.id === id)
      if (!agent) return
      const check = pt ?? toLocal(land, agent)
      if (!inLand(land, check.x, check.y)) {
        setState((s) => removeAgent(s, id))
      } else {
        setState((s) => moveAgent(s, id, agent.nx, agent.ny, true))
      }
    },
    onTap: (id, pt) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const parent = canvas.parentElement
      const w = parent?.clientWidth ?? canvas.clientWidth
      const h = parent?.clientHeight ?? canvas.clientHeight
      const land = landGeom(w, h)

      if (placeKind && (id === 'place' || (!id && inLand(land, pt.x, pt.y)))) {
        const n = toNorm(land, pt.x, pt.y)
        setState((s) => addAgent(s, placeKind, n.nx, n.ny))
        setPlaceKind(null)
        return
      }
      if (id === 'ocean') {
        setState((s) => ({
          ...s,
          status: 'Oceans: CO₂ dissolves in seawater. Raise Ocean strength in Controls.',
        }))
        return
      }
      if (id === 'soil') {
        setState((s) => ({
          ...s,
          status: 'Decomposition: Dead matter in the soil releases CO₂. More trees → more leaf litter.',
        }))
        return
      }
      if (id && id !== 'place') {
        const agent = stateRef.current.agents.find((a) => a.id === id)
        if (!agent) return
        const tip =
          agent.kind === 'plant'
            ? 'Photosynthesis: This tree takes CO₂ and releases O₂ in daylight. Drag to move · drag off land to remove.'
            : agent.kind === 'animal'
              ? 'Respiration: This animal uses O₂ and breathes out CO₂. Drag to move · drag off land to remove.'
              : 'Combustion: This factory burns fuel → lots of CO₂. Drag to move · drag off land to remove.'
        setState((s) => ({ ...s, status: tip }))
      }
    },
  })

  const st = stateRef.current
  const rates = useMemo(() => computeRates(st), [tick, st])
  const balance = balanceStatus(st.netCo2Rate)
  const [now, why, next] = triadForState(st)
  void tick

  const controls = (
    <ControlPanel title="Controls">
      <p className="co-status">{st.status}</p>

      <ControlSection title="Place on the land">
        <ControlHint>Select a tool, then tap the meadow. Drag agents off land to remove.</ControlHint>
        <div className="co-place-row">
          {(
            [
              { kind: 'plant' as const, label: 'Tree', src: AGENT_ART.tree },
              { kind: 'animal' as const, label: 'Animal', src: AGENT_ART.cow },
              { kind: 'factory' as const, label: 'Factory', src: AGENT_ART.factory },
            ] as const
          ).map(({ kind, label, src }) => (
            <button
              key={kind}
              type="button"
              className={`co-place-btn ${placeKind === kind ? 'is-active' : ''}`}
              onClick={() => setPlaceKind((k) => (k === kind ? null : kind))}
            >
              <img src={src} alt="" width={28} height={28} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="co-counts">
          Trees {plantCount(st)}/{AGENT_LIMITS.plant} · Animals {animalCount(st)}/{AGENT_LIMITS.animal} ·
          Factories {factoryCount(st)}/{AGENT_LIMITS.factory}
        </p>
      </ControlSection>

      <ControlSection title="How the cycle works">
        <ControlHint>Each step sets a world and gives you a task.</ControlHint>
        <ControlStack>
          {CYCLE_STEPS.map((step) => (
            <PresetButton
              key={step.id}
              primary={st.cycleStep === step.id}
              sound="click"
              className={st.cycleStep === step.id ? 'is-active' : undefined}
              onClick={() => setState((s) => setCycleStep(s, step.id))}
            >
              {step.label}
            </PresetButton>
          ))}
          <PresetButton
            primary={st.cycleStep === 'free'}
            sound="click"
            className={st.cycleStep === 'free' ? 'is-active' : undefined}
            onClick={() => setState((s) => setCycleStep(s, 'free'))}
          >
            Free play
          </PresetButton>
        </ControlStack>
      </ControlSection>

      <ControlSection title="NOW / WHY / NEXT">
        <div className="co-triad">
          <div className="co-triad-card co-now">
            <strong>NOW</strong>
            <p>{now}</p>
          </div>
          <div className="co-triad-card co-why">
            <strong>WHY</strong>
            <p>{why}</p>
          </div>
          <div className="co-triad-card co-next">
            <strong>NEXT</strong>
            <p>{next}</p>
          </div>
        </div>
        <p className="co-balance">Balance: {balance}</p>
        <p className="co-net">
          Net CO₂ {st.netCo2Rate > 0.4 ? '▲' : st.netCo2Rate < -0.4 ? '▼' : '●'} · Net O₂{' '}
          {st.netO2Rate > 0.4 ? '▲' : st.netO2Rate < -0.4 ? '▼' : '●'}
        </p>
      </ControlSection>

      <ControlSection title="Environment">
        <ToggleSwitch
          label="Day"
          checked={st.isDay}
          onChange={(on) => setState((s) => ({ ...s, isDay: on, autoDayNight: false }))}
        />
        <ToggleSwitch
          label="Auto day/night"
          checked={st.autoDayNight}
          onChange={(on) => setState((s) => ({ ...s, autoDayNight: on }))}
        />
        <Slider
          label="Sunlight %"
          min={0}
          max={100}
          value={st.sunlightIntensity}
          onChange={(v) => setState((s) => ({ ...s, sunlightIntensity: v }))}
        />
        <Slider
          label="Ocean strength"
          min={0}
          max={16}
          value={st.oceanStrength}
          onChange={(v) => setState((s) => ({ ...s, oceanStrength: v }))}
        />
        <Slider
          label="Trees (count)"
          min={0}
          max={AGENT_LIMITS.plant}
          step={1}
          value={plantCount(st)}
          onChange={(v) => setState((s) => setAgentCounts(s, v, animalCount(s), factoryCount(s)))}
        />
        <Slider
          label="Animals (count)"
          min={0}
          max={AGENT_LIMITS.animal}
          step={1}
          value={animalCount(st)}
          onChange={(v) => setState((s) => setAgentCounts(s, plantCount(s), v, factoryCount(s)))}
        />
        <Slider
          label="Factories (count)"
          min={0}
          max={AGENT_LIMITS.factory}
          step={1}
          value={factoryCount(st)}
          onChange={(v) => setState((s) => setAgentCounts(s, plantCount(s), animalCount(s), v))}
        />
        <Slider
          label="Speed ×"
          min={0.25}
          max={3}
          step={0.05}
          value={st.simSpeed}
          onChange={(v) => setState((s) => ({ ...s, simSpeed: v }))}
        />
      </ControlSection>

      <ControlSection title="Simulation">
        <PlayPauseStepButton
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onStep={() => {
            stateRef.current = stepCarbonOxygen(stateRef.current, 0.05)
            bump()
          }}
        />
        <ResetButton onReset={reset} />
      </ControlSection>

      <ControlSection title="Challenges (optional)">
        <ControlHint>Applies a starting world — you keep playing.</ControlHint>
        <ControlStack>
          <PresetButton onClick={() => setState((s) => applyChallenge(s, 'deforestation'))}>
            Challenge: Deforestation
          </PresetButton>
          <PresetButton onClick={() => setState((s) => applyChallenge(s, 'reforestation'))}>
            Challenge: Reforestation
          </PresetButton>
          <PresetButton
            sound="click"
            primary={false}
            onClick={() => setState((s) => applyChallenge(s, 'none'))}
          >
            Clear challenge banner
          </PresetButton>
        </ControlStack>
      </ControlSection>

      <ControlSection title="Rates (live)">
        <p className="co-rates">
          Photo {rates.photosynthesis.toFixed(1)} · Resp {rates.respiration.toFixed(1)} · Decay{' '}
          {rates.decomposition.toFixed(1)} · Ocean {rates.oceanAbsorb.toFixed(1)} · Burn{' '}
          {rates.combustion.toFixed(1)}
        </p>
      </ControlSection>
    </ControlPanel>
  )

  return (
    <SimShell
      title="Carbon–Oxygen Cycle"
      subtitle={
        placeKind
          ? `Tap the meadow to place a ${placeKind === 'plant' ? 'tree' : placeKind}`
          : 'Watch O₂ and CO₂ stream live from each agent you place'
      }
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={reset}
      controls={controls}
      hidePlay
      hideReset
    />
  )
}
