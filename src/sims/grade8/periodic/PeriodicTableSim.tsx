import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
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

function drawLightBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#f7f9fb')
  g.addColorStop(1, '#e8eef4')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawPeriodicTable(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  selected: ElementInfo,
  fs: number,
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

  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('Periodic table (first 18)', x0, 22)

  for (const el of ELEMENTS) {
    const cell = tableCell(el.period, el.group)
    if (!cell) continue
    const x = x0 + cell.col * cellW + pad
    const y = y0 + cell.row * cellH + pad
    const cw = cellW - pad * 2
    const ch = cellH - pad * 2
    const isSel = el.symbol === selected.symbol

    roundRect(ctx, x, y, cw, ch, 6)
    ctx.fillStyle = CATEGORY_COLORS[el.category]
    ctx.globalAlpha = isSel ? 1 : 0.82
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = isSel ? '#1a252f' : '#ecf0f1'
    ctx.lineWidth = isSel ? 3 : 1.5
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

  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`${el.name} (${el.symbol})`, cx, 28)
  ctx.font = `${fs}px Roboto, sans-serif`
  ctx.fillStyle = '#5d6d7e'
  ctx.fillText(`Config: ${el.electronConfig}`, cx, 28 + fs + 6)
  ctx.fillText(CATEGORY_LABELS[el.category], cx, 28 + (fs + 6) * 2)

  ctx.beginPath()
  ctx.arc(cx, cy, maxR * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = '#c0392b'
  ctx.fill()
  ctx.strokeStyle = '#922b21'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
  ctx.fillText(`${el.z}+`, cx, cy + 4)

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

function hitTestElement(
  mx: number,
  my: number,
  w: number,
  h: number,
): ElementInfo | null {
  const tableW = w * 0.46
  const tableH = h * 0.72
  const x0 = 12
  const y0 = 36
  const cols = 8
  const rows = 3
  const cellW = tableW / cols
  const cellH = tableH / rows
  const pad = 3

  for (const el of ELEMENTS) {
    const cell = tableCell(el.period, el.group)
    if (!cell) continue
    const x = x0 + cell.col * cellW + pad
    const y = y0 + cell.row * cellH + pad
    const cw = cellW - pad * 2
    const ch = cellH - pad * 2
    if (mx >= x && mx <= x + cw && my >= y && my <= y + ch) return el
  }
  return null
}

export function PeriodicTableSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(createBohrAnimState())
  const [running, setRunning] = useState(true)
  const [symbol, setSymbol] = useState('C')
  const [version, setVersion] = useState(0)

  const element = getElementBySymbol(symbol) ?? ELEMENTS[5]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const hit = hitTestElement(mx, my, rect.width, rect.height)
      if (hit) {
        setSymbol(hit.symbol)
        setVersion((v) => v + 1)
      }
    }
    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) animRef.current = stepBohrAnim(animRef.current, dt)
      const fs = fontPx(13, w, h)
      drawLightBg(ctx, w, h)
      drawPeriodicTable(ctx, w, h, element, fs)
      drawBohrModel(ctx, w, h, element, animRef.current.time, running, fs)

      ctx.fillStyle = '#7f8c8d'
      ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('Click a tile to select · Play animates electron shells', 12, h - 10)
    },
    [element, running],
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
        setSymbol('C')
        setRunning(true)
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
