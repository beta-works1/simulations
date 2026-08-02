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

type GasParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  kind: 'co2' | 'o2'
}

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

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  if (glow) {
    ctx.beginPath()
    ctx.arc(x, y - 18, 28, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(46,204,113,0.22)'
    ctx.fill()
  }
  ctx.fillStyle = '#92400e'
  ctx.fillRect(x - 4, y - 8, 8, 22)
  ctx.beginPath()
  ctx.arc(x, y - 22, 18, 0, Math.PI * 2)
  ctx.fillStyle = '#16a34a'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x - 10, y - 16, 10, 0, Math.PI * 2)
  ctx.fillStyle = '#15803d'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + 10, y - 18, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#22c55e'
  ctx.fill()
}

function drawAnimal(ctx: CanvasRenderingContext2D, x: number, y: number, deer: boolean) {
  if (deer) {
    ctx.fillStyle = '#b45309'
    ctx.beginPath()
    ctx.ellipse(x, y - 6, 16, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + 8, y - 16, 10, 8)
    ctx.strokeStyle = '#78350f'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + 10, y - 16)
    ctx.lineTo(x + 6, y - 26)
    ctx.moveTo(x + 14, y - 16)
    ctx.lineTo(x + 18, y - 26)
    ctx.stroke()
  } else {
    ctx.fillStyle = '#f5f5f5'
    ctx.beginPath()
    ctx.ellipse(x, y - 6, 14, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(x - 10, y - 12, 6, 8)
    ctx.fillRect(x + 4, y - 12, 6, 8)
    ctx.beginPath()
    ctx.arc(x + 12, y - 10, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#e2e8f0'
    ctx.fill()
  }
}

function drawFactory(ctx: CanvasRenderingContext2D, x: number, y: number, smoke: number) {
  ctx.fillStyle = '#64748b'
  ctx.fillRect(x - 18, y - 28, 36, 36)
  ctx.fillStyle = '#475569'
  ctx.fillRect(x - 8, y - 48, 8, 20)
  ctx.fillRect(x + 6, y - 42, 8, 14)
  if (smoke > 0.15) {
    const puffs = Math.min(3, 1 + Math.floor(smoke))
    for (let p = 0; p < puffs; p++) {
      ctx.beginPath()
      ctx.arc(x - 4 + p * 6, y - 58 - p * 10, 5 + p * 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(70,70,70,${Math.min(0.5, 0.15 + smoke * 0.08)})`
      ctx.fill()
    }
  }
}

export function CarbonOxygenCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CarbonOxygenState>(createCarbonOxygenState())
  const particlesRef = useRef<GasParticle[]>([])
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
    setPlaceKind(null)
    setRunning(true)
    bump()
  }, [bump])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const s = stateRef.current
      if (running) {
        stateRef.current = stepCarbonOxygen(s, Math.min(dt, 0.05))
      }
      const st = stateRef.current
      const rates = computeRates(st)
      const land = landGeom(w, h)
      const groundY = h * 0.68
      const oceanW = w * 0.22

      const blend = st.isDay ? 0.35 + (st.sunlightIntensity / 100) * 0.65 : 0
      const r = Math.round(11 + (110 - 11) * blend)
      const g = Math.round(22 + (182 - 22) * blend)
      const b = Math.round(40 + (224 - 40) * blend)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = st.isDay ? '#0ea5e9' : '#0369a1'
      ctx.fillRect(0, h * 0.62, oceanW, h * 0.38)

      ctx.fillStyle = st.isDay ? '#5a8f3d' : '#3d5c32'
      ctx.fillRect(oceanW - 10, groundY, w - oceanW + 10, h - groundY)

      ctx.fillStyle = st.isDay ? 'rgba(106,143,120,0.55)' : 'rgba(45,74,58,0.65)'
      ctx.beginPath()
      ctx.moveTo(0, groundY)
      ctx.quadraticCurveTo(w * 0.2, groundY - 48, w * 0.4, groundY - 28)
      ctx.quadraticCurveTo(w * 0.6, groundY - 64, w * 0.8, groundY - 30)
      ctx.quadraticCurveTo(w * 0.95, groundY - 40, w, groundY - 20)
      ctx.lineTo(w, groundY)
      ctx.closePath()
      ctx.fill()

      if (st.isDay) {
        ctx.beginPath()
        ctx.arc(w * 0.42, h * 0.14, 28, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(w * 0.42, h * 0.14, 14, 0, Math.PI * 2)
        ctx.fillStyle = '#e8eef8'
        ctx.fill()
      }

      if (placeKind) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeRect(land.left, land.top, land.width, land.height)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(land.left, land.top, land.width, land.height)
      }

      const glowPhoto = rates.photosynthesis > 0.3 && st.isDay
      for (const a of st.agents) {
        const p = toLocal(land, a)
        if (a.kind === 'plant') drawTree(ctx, p.x, p.y, glowPhoto)
        else if (a.kind === 'animal') drawAnimal(ctx, p.x, p.y, a.id.length % 2 === 0)
        else drawFactory(ctx, p.x, p.y, rates.combustion)
      }

      const particles = particlesRef.current
      const pick = <T,>(arr: T[]) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : null)
      const plants = st.agents.filter((a) => a.kind === 'plant').map((a) => toLocal(land, a))
      const animals = st.agents.filter((a) => a.kind === 'animal').map((a) => toLocal(land, a))
      const factories = st.agents.filter((a) => a.kind === 'factory').map((a) => toLocal(land, a))
      const budget = Math.min(10, 2 + Math.floor(dt * 60))

      if (running) {
        if (st.isDay && rates.photosynthesis > 0.1 && plants.length) {
          for (let i = 0; i < budget && Math.random() < rates.photosynthesis * 0.1; i++) {
            const src = pick(plants)
            if (!src) break
            particles.push({
              x: src.x,
              y: src.y - 24,
              vx: (Math.random() - 0.5) * 10,
              vy: -22 - Math.random() * 24,
              life: 1,
              kind: 'o2',
            })
          }
        }
        if (rates.respiration > 0.1 && animals.length) {
          for (let i = 0; i < budget && Math.random() < rates.respiration * 0.12; i++) {
            const src = pick(animals)
            if (!src) break
            particles.push({
              x: src.x,
              y: src.y - 14,
              vx: (Math.random() - 0.5) * 8,
              vy: -12 - Math.random() * 16,
              life: 1,
              kind: 'co2',
            })
          }
        }
        if (rates.decomposition > 0.12) {
          for (let i = 0; i < 2 && Math.random() < rates.decomposition * 0.25; i++) {
            particles.push({
              x: w * (0.4 + Math.random() * 0.25),
              y: h * 0.88,
              vx: (Math.random() - 0.5) * 6,
              vy: -8 - Math.random() * 10,
              life: 1,
              kind: 'co2',
            })
          }
        }
        if (rates.combustion > 0.15 && factories.length) {
          for (let i = 0; i < budget && Math.random() < rates.combustion * 0.1; i++) {
            const src = pick(factories)
            if (!src) break
            particles.push({
              x: src.x + 4,
              y: src.y - 48,
              vx: (Math.random() - 0.5) * 10,
              vy: -18 - Math.random() * 20,
              life: 1.1,
              kind: 'co2',
            })
          }
        }
        if (rates.oceanAbsorb > 0.15) {
          for (let i = 0; i < budget && Math.random() < rates.oceanAbsorb * 0.3; i++) {
            particles.push({
              x: oceanW * Math.random(),
              y: h * 0.2 + Math.random() * 40,
              vx: (Math.random() - 0.5) * 4,
              vy: 14 + Math.random() * 16,
              life: 1.2,
              kind: 'co2',
            })
          }
        }
      }

      while (particles.length > 120) particles.shift()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt * 0.55
        if (p.vy > 8 && p.y > h * 0.72 && p.kind === 'co2') p.life -= dt * 0.8
        if (p.life <= 0 || p.y < -20 || p.y > h + 10) {
          particles.splice(i, 1)
          continue
        }
        const alpha = Math.max(0, Math.min(1, p.life))
        const sinking = p.vy > 8 && p.kind === 'co2'
        ctx.beginPath()
        ctx.arc(p.x, p.y, sinking ? 3.5 : 4, 0, Math.PI * 2)
        ctx.fillStyle = sinking
          ? `rgba(56,189,248,${alpha})`
          : p.kind === 'o2'
            ? `rgba(46,204,113,${alpha})`
            : `rgba(231,76,60,${alpha})`
        ctx.fill()
      }

      ctx.fillStyle = 'rgba(15,23,42,0.88)'
      roundRect(ctx, 12, 12, 160, 62, 10)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${fontPx(11, w, h)}px system-ui,sans-serif`
      ctx.fillText('Atmosphere', 22, 30)
      const barW = 140
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      roundRect(ctx, 22, 38, barW, 10, 4)
      ctx.fill()
      ctx.fillStyle = '#e74c3c'
      roundRect(ctx, 22, 38, (st.co2Level / 100) * barW, 10, 4)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      roundRect(ctx, 22, 54, barW, 10, 4)
      ctx.fill()
      ctx.fillStyle = '#27ae60'
      roundRect(ctx, 22, 54, (st.o2Level / 100) * barW, 10, 4)
      ctx.fill()
      ctx.fillStyle = '#ecf0f1'
      ctx.font = `${fontPx(9, w, h)}px system-ui,sans-serif`
      ctx.fillText(`CO₂ ${st.co2Level.toFixed(0)}%`, 26, 46)
      ctx.fillText(`O₂ ${st.o2Level.toFixed(0)}%`, 26, 62)

      drawBadge(ctx, running ? 'Running' : 'Paused', 12, 90, {
        bg: running ? 'rgba(39,174,96,0.85)' : 'rgba(0,0,0,0.45)',
      })

      const avg = (list: { x: number; y: number }[], fx: number, fy: number) => {
        if (!list.length) return { x: fx, y: fy }
        return {
          x: list.reduce((n, p) => n + p.x, 0) / list.length,
          y: list.reduce((n, p) => n + p.y, 0) / list.length,
        }
      }
      if (rates.photosynthesis > 0.15) {
        const p = avg(plants, w * 0.4, h * 0.4)
        drawLabelPill(ctx, 'Photosynthesis', p.x, p.y - 36)
      }
      if (rates.respiration > 0.1) {
        const p = avg(animals, w * 0.45, h * 0.55)
        drawLabelPill(ctx, 'Respiration', p.x, p.y - 28)
      }
      if (rates.decomposition > 0.15) drawLabelPill(ctx, 'Decomposition', w * 0.5, h * 0.82)
      if (rates.oceanAbsorb > 0.15) drawLabelPill(ctx, 'Ocean absorb', oceanW * 0.5, h * 0.72)
      if (rates.combustion > 0.2) {
        const p = avg(factories, w * 0.7, h * 0.5)
        drawLabelPill(ctx, 'Combustion', p.x, p.y - 52)
      }

      const chart = { x: w * 0.28, y: h - 120, w: Math.min(400, w * 0.45), h: 100 }
      ctx.fillStyle = 'rgba(15,23,42,0.82)'
      roundRect(ctx, chart.x, chart.y, chart.w, chart.h, 10)
      ctx.fill()
      ctx.fillStyle = '#bdc3c7'
      ctx.font = `${fontPx(10, w, h)}px system-ui,sans-serif`
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
          { color: '#2ecc71', label: 'O₂ from trees' },
          { color: '#e74c3c', label: 'CO₂ from animals/factories' },
        ],
        Math.max(12, w - 280),
        16,
        11,
      )

      if (st.takeaway) {
        ctx.fillStyle = 'rgba(192,57,43,0.92)'
        roundRect(ctx, w / 2 - 220, 12, 440, 28, 8)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `${fontPx(11, w, h)}px system-ui,sans-serif`
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
        const r = a.kind === 'factory' ? 28 : a.kind === 'plant' ? 24 : 20
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
          {(['plant', 'animal', 'factory'] as AgentKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              className={`co-place-btn ${placeKind === kind ? 'is-active' : ''}`}
              onClick={() => setPlaceKind((k) => (k === kind ? null : kind))}
            >
              {kind === 'plant' ? 'Tree' : kind === 'animal' ? 'Animal' : 'Factory'}
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
          : 'Drag agents · gases come from each one you place'
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
