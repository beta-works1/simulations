import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
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
  addSpecies,
  canLink,
  connectionsFor,
  createFoodWebState,
  createGrasslandChainState,
  createGrasslandWebState,
  levelColor,
  removeNode,
  setLinkFrom,
  stepFoodWeb,
  toggleLink,
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

function drawTrophicBands(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bands = [
    { y: 0.68, color: 'rgba(39,174,96,0.08)', label: 'Producers' },
    { y: 0.46, color: 'rgba(241,196,15,0.07)', label: 'Primary consumers' },
    { y: 0.24, color: 'rgba(231,76,60,0.07)', label: 'Consumers' },
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
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [linkMode, setLinkMode] = useState(false)
  const [version, setVersion] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const syncUi = (s: FoodWebState) => {
    setSelectedId(s.selectedId)
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

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0f2536')
      bg.addColorStop(0.55, '#163828')
      bg.addColorStop(1, '#1a3324')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      drawTrophicBands(ctx, w, h)

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

        ctx.strokeStyle = 'rgba(236,240,241,0.4)'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(cpx, cpy, x2, y2)
        ctx.stroke()

        const angle = Math.atan2(y2 - cpy, x2 - cpx)
        ctx.fillStyle = 'rgba(236,240,241,0.55)'
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
        ctx.arc(px, py, 6, 0, Math.PI * 2)
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
        drawHoverHalo(ctx, x, y, nodeR + 8, isHover || isSel || isLinkFrom)

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = levelColor(n.level)
        ctx.fill()
        ctx.restore()

        if (isLinkFrom) {
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

        if (isSel || isHover) {
          const labelY = y + nodeR + 12
          drawLabelPill(ctx, LEVEL_LABELS[n.level], x, labelY, {
            fontSize: Math.max(9, fs - 3),
            bold: false,
          })
        }
      }

      drawLabelPill(ctx, 'energy flows along arrows →', w / 2, 20, {
        fontSize: Math.max(10, fs - 2),
        bold: false,
        bg: 'rgba(0,0,0,0.35)',
        fg: '#f4d03f',
      })

      if (linkModeRef.current && s.linkFromId) {
        drawLabelPill(ctx, 'tap a prey species to connect', w / 2, 40, {
          fontSize: Math.max(9, fs - 2),
          bold: false,
          bg: 'rgba(52,152,219,0.45)',
          fg: '#fff',
        })
      }

      if (hintShown.current) {
        drawHint(
          ctx,
          linkModeRef.current
            ? 'link mode: tap eater, then food · drag nodes to rearrange'
            : 'drag nodes · tap to inspect · toggle link mode to build',
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
    syncUi(stateRef.current)
  }

  const add = (level: TrophicLevel, name: string) => {
    stateRef.current = addSpecies(stateRef.current, level, name)
    syncUi(stateRef.current)
  }

  const selected = stateRef.current.nodes.find((n) => n.id === selectedId) ?? null
  const conn = selected ? connectionsFor(stateRef.current, selected.id) : null

  return (
    <SimShell
      title="Food Chain / Food Web"
      subtitle="Build links and watch energy move between species"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => load(createFoodWebState)}
      controls={
        <>
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
                ? 'Tap the eater, then tap its food. Tap the same pair again to remove a link.'
                : 'Drag species to rearrange. Tap a node to see its role.'}
            </ControlHint>
            {selected ? (
              <>
                <ControlStats>
                  <ControlStat label="Selected" value={selected.name} />
                  <ControlStat label="Role" value={LEVEL_LABELS[selected.level]} />
                  <ControlStat label="Eats" value={String(conn?.outCount ?? 0)} />
                  <ControlStat label="Eaten by" value={String(conn?.inCount ?? 0)} />
                </ControlStats>
                <ControlHint>{LEVEL_HINTS[selected.level]}</ControlHint>
                <PresetButton
                  sound="click"
                  primary={false}
                  onClick={() => {
                    stateRef.current = removeNode(stateRef.current, selected.id)
                    syncUi(stateRef.current)
                  }}
                >
                  Remove {selected.name}
                </PresetButton>
              </>
            ) : (
              <ControlHint>Select a species on the canvas to inspect or remove it.</ControlHint>
            )}
          </ControlSection>

          <ControlSection title="Examples">
            <ControlStack>
              <PresetButton onClick={() => load(createGrasslandChainState)}>Food chain</PresetButton>
              <PresetButton onClick={() => load(createGrasslandWebState)}>Grassland web</PresetButton>
            </ControlStack>
            <ControlHint>Chain: one path. Web: many linked paths — more stable.</ControlHint>
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
            <TermTip title={PRODUCER.title} body={PRODUCER.body} />
            <TermTip title={PRIMARY_CONSUMER.title} body={PRIMARY_CONSUMER.body} />
            <TermTip title={SECONDARY_CONSUMER.title} body={SECONDARY_CONSUMER.body} />
            <TermTip title={TERTIARY_CONSUMER.title} body={TERTIARY_CONSUMER.body} />
            <TermTip title={DECOMPOSER.title} body={DECOMPOSER.body} />
            <TermTip title={TROPHIC_LEVELS.title} body={TROPHIC_LEVELS.body} />
            <TermTip title={WEB_STABILITY.title} body={WEB_STABILITY.body} />
          </ControlSection>
        </>
      }
    />
  )
}