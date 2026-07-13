import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  ELEMENTS,
  getElementBySymbol,
  tableCell,
  type ElementInfo,
} from './elementsData'

export interface BohrAnimState {
  time: number
}

export function createBohrAnimState(): BohrAnimState {
  return { time: 0 }
}

export function stepBohrAnim(s: BohrAnimState, dt: number): BohrAnimState {
  return { time: s.time + dt }
}

type CellLayout = { symbol: string; x: number; y: number; w: number; h: number }

type Layout = {
  cells: CellLayout[]
}

function drawLightBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  clearThemedScene(ctx, w, h, 'chemistry')
}

function drawPeriodicTable(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  selected: ElementInfo,
  hoverSymbol: string | null,
  fs: number,
  cells: CellLayout[],
) {
  const tableW = w * 0.46
  const tableH = h * 0.72
  const x0 = 12
  const y0 = 36
  const cols = 8
  const rows = 3
  const cellW = tableW / cols
  const cellH = tableH / rows
  const pad = 3

  drawLabelPill(ctx, 'Periodic table (first 18)', x0 + tableW / 2, 22, {
    align: 'center',
    fontSize: fs,
    bold: true,
    bg: 'rgba(255,255,255,0.65)',
  })

  cells.length = 0

  for (const el of ELEMENTS) {
    const cell = tableCell(el.period, el.group)
    if (!cell) continue
    const x = x0 + cell.col * cellW + pad
    const y = y0 + cell.row * cellH + pad
    const cw = cellW - pad * 2
    const ch = cellH - pad * 2
    const isSel = el.symbol === selected.symbol
    const isHover = el.symbol === hoverSymbol

    cells.push({ symbol: el.symbol, x, y, w: cw, h: ch })

    drawHoverHalo(ctx, x + cw / 2, y + ch / 2, Math.max(cw, ch) * 0.55, isHover && !isSel)

    roundRect(ctx, x, y, cw, ch, 6)
    ctx.fillStyle = CATEGORY_COLORS[el.category]
    ctx.globalAlpha = isSel ? 1 : isHover ? 0.95 : 0.82
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = isSel ? '#1a252f' : isHover ? '#2980b9' : '#ecf0f1'
    ctx.lineWidth = isSel ? 3 : isHover ? 2.5 : 1.5
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = `${Math.max(9, fs - 3)}px Roboto, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(String(el.z), x + 5, y + 12)
    ctx.font = `700 ${fs + 2}px Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(el.symbol, x + cw / 2, y + ch / 2 + 2)
    ctx.font = `${Math.max(9, fs - 4)}px Roboto, sans-serif`
    ctx.fillText(el.name.slice(0, 6), x + cw / 2, y + ch - 8)
  }
}

function drawBohrModel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  el: ElementInfo,
  time: number,
  running: boolean,
  fs: number,
) {
  const cx = w * 0.74
  const cy = h * 0.48
  const maxR = Math.min(w, h) * 0.28

  drawLabelPill(ctx, `${el.name} (${el.symbol})`, cx, 28, { fontSize: fs + 2 })
  drawValueChip(ctx, 'Config', el.electronConfig, cx - 60, 28 + fs + 14, { fontSize: fs })
  drawValueChip(ctx, '', CATEGORY_LABELS[el.category], cx + 70, 28 + fs + 14, {
    fontSize: Math.max(10, fs - 1),
    accent: true,
  })

  ctx.beginPath()
  ctx.arc(cx, cy, maxR * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = '#c0392b'
  ctx.fill()
  ctx.strokeStyle = '#922b21'
  ctx.lineWidth = 2
  ctx.stroke()
  drawValueChip(ctx, '', `${el.z}+`, cx, cy, { fontSize: Math.max(10, fs - 2) })

  for (let shell = 0; shell < el.shells.length; shell++) {
    const count = el.shells[shell]
    const r = maxR * (0.28 + shell * 0.22)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(52, 73, 94, 0.35)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    for (let i = 0; i < count; i++) {
      const base = (i / count) * Math.PI * 2
      const angle = running ? base + time * (1.2 - shell * 0.15) * (shell % 2 === 0 ? 1 : -1) : base
      const ex = cx + Math.cos(angle) * r
      const ey = cy + Math.sin(angle) * r
      ctx.beginPath()
      ctx.arc(ex, ey, Math.max(4, fs * 0.32), 0, Math.PI * 2)
      ctx.fillStyle = '#2980b9'
      ctx.fill()
      ctx.strokeStyle = '#1a5276'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

export function PeriodicTableSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(createBohrAnimState())
  const paramsRef = useRef({ symbol: 'C' })
  const layoutRef = useRef<Layout>({ cells: [] })
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [symbol, setSymbol] = useState('C')
  const [version, setVersion] = useState(0)

  paramsRef.current.symbol = symbol
  const element = getElementBySymbol(symbol) ?? ELEMENTS[5]

  useEffect(() => {
    const id = window.setInterval(() => {
      setSymbol(paramsRef.current.symbol)
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      for (const c of layoutRef.current.cells) {
        if (pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h) return c.symbol
      }
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      paramsRef.current.symbol = id
      setSymbol(id)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) animRef.current = stepBohrAnim(animRef.current, dt)
      const fs = fontPx(13, w, h)
      const el = getElementBySymbol(paramsRef.current.symbol) ?? ELEMENTS[5]
      drawLightBg(ctx, w, h)
      drawPeriodicTable(ctx, w, h, el, hoverRef.current, fs, layoutRef.current.cells)
      drawBohrModel(ctx, w, h, el, animRef.current.time, running, fs)

      if (hintShown.current) {
        drawHint(ctx, 'click an element', w * 0.23, h - 18, w, h)
      }
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Periodic Table Explorer"
      subtitle="First 18 elements — Bohr model and electron configuration"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        animRef.current = createBohrAnimState()
        paramsRef.current.symbol = 'C'
        setSymbol('C')
        setRunning(true)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Element">
            <ControlHint>Pick from the list or click a tile on the table.</ControlHint>
            <ControlSelect
              label="Selected element"
              value={symbol}
              options={ELEMENTS.map((e) => ({ value: e.symbol, label: `${e.symbol} — ${e.name}` }))}
              onChange={(v) => {
                paramsRef.current.symbol = v
                setSymbol(v)
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
          <ControlSection title="Details">
            <ControlStats>
              <ControlStat label="Atomic number" value={String(element.z)} />
              <ControlStat label="Electron config" value={element.electronConfig} />
              <ControlStat label="Category" value={CATEGORY_LABELS[element.category]} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
