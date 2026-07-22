import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStack,
  ControlStat,
  ControlStats,
  InfoTooltip,
  PresetButton,
  ToggleSwitch,
} from '../../shared/Controls'
import { fillFittedText, fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  DECOMPOSER,
  FOOD_CHAIN,
  FOOD_WEB,
  INTRO,
  LEVEL_HINTS,
  LEVEL_LABELS,
  PRIMARY_CONSUMER,
  PRODUCER,
  SECONDARY_CONSUMER,
  TERTIARY_CONSUMER,
  TROPHIC_LEVELS,
  WEB_STABILITY,
} from './foodWebGuide'
import {
  BASE_PRODUCER_ENERGY,
  addSpecies,
  canLink,
  computeNodeEnergy,
  connectionsFor,
  createFoodWebState,
  createGrasslandChainState,
  createGrasslandWebState,
  formatEnergy,
  levelColor,
  removalImpact,
  removeNode,
  setLinkFrom,
  stepFoodWeb,
  toggleLink,
  trophicDepth,
  webStability,
  type FoodWebState,
  type TrophicLevel,
} from './foodWebModel'

function clamp01(n: number) {
  return Math.max(0.08, Math.min(0.92, n))
}

function TermTip({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <InfoTooltip title={title}>
        <p>{body}</p>
      </InfoTooltip>
      <strong style={{ fontSize: 13 }}>{title}</strong>
    </div>
  )
}

function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) {
  const sx = w * 0.08
  const sy = h * 0.12
  const r = Math.min(w, h) * 0.045 + Math.sin(pulse * 2) * 2
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3)
  glow.addColorStop(0, 'rgba(255,220,80,0.55)')
  glow.addColorStop(1, 'rgba(255,180,40,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(sx, sy, r * 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(sx, sy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#f4d03f'
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${Math.max(9, r * 0.55)}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('Sun', sx, sy + r + 12)
  ctx.textAlign = 'left'
}

function drawTrophicBands(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bands = [
    { y: 0.68, color: 'rgba(39,174,96,0.1)' },
    { y: 0.46, color: 'rgba(241,196,15,0.08)' },
    { y: 0.24, color: 'rgba(231,76,60,0.08)' },
  ]
  bands.forEach((b) => {
    ctx.fillStyle = b.color
    ctx.fillRect(0, h * b.y, w, h * 0.22)
  })
}

export function FoodWebBuilderSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<FoodWebState>(createFoodWebState())
  const layoutRef = useRef<{ id: string; x: number; y: number; r: number }[]>([])
  const hoverRef = useRef<string | null>(null)
  const linkModeRef = useRef(false)
  const baseEnergyRef = useRef(BASE_PRODUCER_ENERGY)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [linkMode, setLinkMode] = useState(false)
  const [baseEnergy, setBaseEnergy] = useState(BASE_PRODUCER_ENERGY)
  const [version, setVersion] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [takeaway, setTakeaway] = useState<string | null>(null)

  baseEnergyRef.current = baseEnergy

  const syncUi = (s: FoodWebState, msg?: string) => {
    setSelectedId(s.selectedId)
    if (msg) setTakeaway(msg)
    setVersion((v) => v + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      for (let i = layoutRef.current.length - 1; i >= 0; i--) {
        const n = layoutRef.current[i]
        if (Math.hypot(pt.x - n.x, pt.y - n.y) < n.r + 6) return n.id
      }
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDragStart: (id) => {
      if (linkModeRef.current) return
      hintShown.current = false
      stateRef.current.selectedId = id
      setSelectedId(id)
    },
    onDrag: (id, pt, size) => {
      if (linkModeRef.current) return
      const node = stateRef.current.nodes.find((n) => n.id === id)
      if (node) {
        node.x = clamp01(pt.x / size.w)
        node.y = clamp01(pt.y / size.h)
      }
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      setTakeaway(null)
      const s = stateRef.current

      if (linkModeRef.current) {
        if (!s.linkFromId) {
          stateRef.current = setLinkFrom(s, id)
          syncUi(stateRef.current)
          return
        }
        const a = s.nodes.find((n) => n.id === s.linkFromId)
        const b = s.nodes.find((n) => n.id === id)
        if (a && b) {
          if (canLink(a, b)) stateRef.current = toggleLink(s, a.id, b.id)
          else if (canLink(b, a)) stateRef.current = toggleLink(s, b.id, a.id)
          else stateRef.current = setLinkFrom(s, null)
        }
        syncUi(stateRef.current)
        return
      }

      s.selectedId = id
      setSelectedId(id)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current = stepFoodWeb(stateRef.current, dt)
      const s = stateRef.current
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)
      const energies = computeNodeEnergy(s, baseEnergyRef.current)
      const stability = webStability(s)
      const maxE = baseEnergyRef.current

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0f2536')
      bg.addColorStop(0.55, '#163828')
      bg.addColorStop(1, '#1a3324')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      drawTrophicBands(ctx, w, h)
      drawSun(ctx, w, h, s.energyPulse)

      // Sun rays to producers
      const sx = w * 0.08
      const sy = h * 0.12
      for (const p of s.nodes.filter((n) => n.level === 'producer')) {
        ctx.strokeStyle = 'rgba(244,208,63,0.15)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(p.x * w, p.y * h)
        ctx.stroke()
      }

      for (const link of s.links) {
        const a = s.nodes.find((n) => n.id === link.from)
        const b = s.nodes.find((n) => n.id === link.to)
        if (!a || !b) continue
        const x1 = a.x * w
        const y1 = a.y * h
        const x2 = b.x * w
        const y2 = b.y * h
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        const cpx = midX + (y2 - y1) * 0.12
        const cpy = midY - (x2 - x1) * 0.12
        const flow = (energies.get(a.id) ?? 0) / maxE

        ctx.strokeStyle = `rgba(244,208,63,${0.2 + flow * 0.5})`
        ctx.lineWidth = 1.5 + flow * 3
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(cpx, cpy, x2, y2)
        ctx.stroke()

        const angle = Math.atan2(y2 - cpy, x2 - cpx)
        ctx.fillStyle = `rgba(236,240,241,${0.35 + flow * 0.4})`
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - 9 * Math.cos(angle - 0.45), y2 - 9 * Math.sin(angle - 0.45))
        ctx.lineTo(x2 - 9 * Math.cos(angle + 0.45), y2 - 9 * Math.sin(angle + 0.45))
        ctx.closePath()
        ctx.fill()

        const p = (s.energyPulse % 1.6) / 1.6
        const t = 1 - p
        const px = t * t * x1 + 2 * t * p * cpx + p * p * x2
        const py = t * t * y1 + 2 * t * p * cpy + p * p * y2
        ctx.beginPath()
        ctx.arc(px, py, 4 + flow * 4, 0, Math.PI * 2)
        ctx.fillStyle = '#f4d03f'
        ctx.shadowColor = '#f4d03f'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      const nodeR = Math.max(20, Math.min(32, Math.min(w, h) * 0.05))
      layoutRef.current = []

      for (const n of s.nodes) {
        const x = n.x * w
        const y = n.y * h
        layoutRef.current.push({ id: n.id, x, y, r: nodeR })

        const isHover = hover === n.id
        const isSel = s.selectedId === n.id
        const isLinkFrom = s.linkFromId === n.id
        const atRisk = stability.atRisk.includes(n.id)
        const e = energies.get(n.id) ?? 0
        const ringR = nodeR + 4 + (e / maxE) * 14

        if (e > 0 && n.level !== 'decomposer') {
          ctx.beginPath()
          ctx.arc(x, y, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(244,208,63,${0.25 + (e / maxE) * 0.45})`
          ctx.lineWidth = 3
          ctx.stroke()
        }

        drawHoverHalo(ctx, x, y, nodeR + 8, isHover || isSel || isLinkFrom)

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = levelColor(n.level)
        ctx.globalAlpha = atRisk ? 0.75 : 1
        ctx.fill()
        ctx.restore()

        if (atRisk) {
          ctx.strokeStyle = '#e74c3c'
          ctx.lineWidth = 2
          ctx.setLineDash([3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        } else if (isLinkFrom) {
          ctx.setLineDash([5, 4])
          ctx.strokeStyle = '#f4d03f'
          ctx.lineWidth = 3
          ctx.stroke()
          ctx.setLineDash([])
        } else if (isSel) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 3
          ctx.stroke()
        } else if (isHover) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        ctx.fillStyle = '#fff'
        ctx.font = `600 ${fs}px Roboto, sans-serif`
        fillFittedText(ctx, n.name, x, y - 2, nodeR * 1.55, fs, {
          minPx: 8,
          align: 'center',
          baseline: 'middle',
        })

        if ((isSel || isHover) && e > 0) {
          drawLabelPill(ctx, formatEnergy(e), x, y + nodeR + 12, {
            fontSize: Math.max(8, fs - 4),
            bold: false,
            bg: 'rgba(0,0,0,0.4)',
            fg: '#f4d03f',
          })
        }
        if (isSel || isHover) {
          drawLabelPill(ctx, LEVEL_LABELS[n.level], x, y + nodeR + (e > 0 ? 28 : 12), {
            fontSize: Math.max(9, fs - 3),
            bold: false,
          })
        }
      }

      drawLabelPill(ctx, `web stability ${stability.score}%`, w * 0.92, 20, {
        fontSize: Math.max(9, fs - 2),
        bold: false,
        bg: stability.score >= 70 ? 'rgba(39,174,96,0.45)' : 'rgba(231,76,60,0.45)',
        fg: '#fff',
        align: 'right',
      })

      if (hintShown.current) {
        drawHint(
          ctx,
          linkModeRef.current
            ? 'link mode: tap eater, then food · ~10% energy up each link'
            : 'drag nodes · tap to inspect · red dashed = single food source',
          w / 2,
          h - 18,
          w,
          h,
          { muted: true },
        )
      }
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, true, version, true)

  const load = (factory: () => FoodWebState) => {
    stateRef.current = factory()
    hintShown.current = true
    setTakeaway(null)
    syncUi(stateRef.current)
  }

  const add = (level: TrophicLevel, name: string) => {
    stateRef.current = addSpecies(stateRef.current, level, name)
    syncUi(stateRef.current)
  }

  const s = stateRef.current
  const selected = s.nodes.find((n) => n.id === selectedId) ?? null
  const conn = selected ? connectionsFor(s, selected.id) : null
  const stability = webStability(s)
  const energies = computeNodeEnergy(s, baseEnergy)
  const impact = selected ? removalImpact(s, selected.id) : null

  return (
    <SimShell
      title="Food Chain / Food Web"
      subtitle="Build links, trace energy, and test ecosystem stability"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => load(createFoodWebState)}
      controls={
        <>
          <ControlSection title="Ecosystem">
            <ControlStats>
              <ControlStat label="Stability" value={`${stability.score}%`} />
              <ControlStat label="Species" value={String(s.nodes.length)} />
              <ControlStat label="Links" value={String(s.links.length)} />
            </ControlStats>
            <ControlHint>{stability.message}</ControlHint>
            <ControlSlider
              label="Sunlight energy"
              value={baseEnergy}
              min={5000}
              max={50000}
              step={500}
              display={formatEnergy(baseEnergy)}
              onChange={(v) => {
                setBaseEnergy(v)
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>

          <ControlSection title="Build">
            <ToggleSwitch
              label="Link mode"
              checked={linkMode}
              onChange={(on) => {
                linkModeRef.current = on
                setLinkMode(on)
                stateRef.current = setLinkFrom(stateRef.current, null)
              }}
            />
            <ControlHint>
              {linkMode
                ? 'Tap the eater, then its food. Only ~10% of energy passes up each link.'
                : 'Drag species to rearrange. Tap a node to inspect energy and role.'}
            </ControlHint>
            {selected ? (
              <>
                <ControlStats>
                  <ControlStat label="Selected" value={selected.name} />
                  <ControlStat label="Role" value={LEVEL_LABELS[selected.level]} />
                  <ControlStat label="Trophic level" value={String(trophicDepth(s, selected.id))} />
                  <ControlStat label="Energy" value={formatEnergy(energies.get(selected.id) ?? 0)} />
                  <ControlStat label="Food sources" value={String(conn?.outCount ?? 0)} />
                  <ControlStat label="Eaten by" value={String(conn?.inCount ?? 0)} />
                </ControlStats>
                <ControlHint>{LEVEL_HINTS[selected.level]}</ControlHint>
                {impact ? <ControlHint>{impact.message}</ControlHint> : null}
                <PresetButton
                  sound="click"
                  primary={false}
                  onClick={() => {
                    const msg = removalImpact(stateRef.current, selected.id).message
                    stateRef.current = removeNode(stateRef.current, selected.id)
                    syncUi(stateRef.current, msg)
                  }}
                >
                  Remove {selected.name}
                </PresetButton>
              </>
            ) : (
              <ControlHint>Select a species on the canvas to inspect or remove it.</ControlHint>
            )}
            {takeaway ? <ControlHint><strong>Effect:</strong> {takeaway}</ControlHint> : null}
          </ControlSection>

          <ControlSection title="Examples">
            <ControlStack>
              <PresetButton onClick={() => load(createGrasslandChainState)}>Food chain</PresetButton>
              <PresetButton onClick={() => load(createGrasslandWebState)}>Grassland web</PresetButton>
            </ControlStack>
            <ControlHint>Try removing one species from each — the web is more stable.</ControlHint>
          </ControlSection>

          <ControlSection title="Add species">
            <ControlStack>
              <PresetButton sound="click" primary={false} onClick={() => add('producer', 'Algae')}>
                + Producer
              </PresetButton>
              <PresetButton sound="click" primary={false} onClick={() => add('herbivore', 'Deer')}>
                + Primary consumer
              </PresetButton>
              <PresetButton sound="click" primary={false} onClick={() => add('carnivore', 'Hawk')}>
                + Consumer
              </PresetButton>
              <PresetButton sound="click" primary={false} onClick={() => add('decomposer', 'Bacteria')}>
                + Decomposer
              </PresetButton>
            </ControlStack>
          </ControlSection>

          <ControlSection title="Learn">
            <ControlHint>{INTRO}</ControlHint>
            <TermTip title={FOOD_CHAIN.title} body={FOOD_CHAIN.body} />
            <TermTip title={FOOD_WEB.title} body={FOOD_WEB.body} />
            <TermTip title={TROPHIC_LEVELS.title} body={TROPHIC_LEVELS.body} />
            <TermTip title={WEB_STABILITY.title} body={WEB_STABILITY.body} />
            <TermTip title={PRODUCER.title} body={PRODUCER.body} />
            <TermTip title={PRIMARY_CONSUMER.title} body={PRIMARY_CONSUMER.body} />
            <TermTip title={SECONDARY_CONSUMER.title} body={SECONDARY_CONSUMER.body} />
            <TermTip title={TERTIARY_CONSUMER.title} body={TERTIARY_CONSUMER.body} />
            <TermTip title={DECOMPOSER.title} body={DECOMPOSER.body} />
          </ControlSection>
        </>
      }
    />
  )
}
