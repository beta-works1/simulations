/**
 * Build an Atom — React + Canvas recreation from PhET build-an-atom BAAModel limits.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, fillThemeBackground } from '../shared/canvasTheme'
import { SimShell } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  chargeLabel,
  clampAtom,
  defaultAtomState,
  elementName,
  elementSymbol,
  massNumber,
  MAX_ELECTRONS,
  MAX_NEUTRONS,
  MAX_PROTONS,
  netCharge,
  type AtomState,
} from './model'

type BucketHit = { id: string; x: number; y: number; w: number; h: number }

function bucketLayout(_w: number, h: number): BucketHit[] {
  const bw = 40
  const bh = 40
  const x0 = 14
  const gap = 8
  const startY = Math.max(36, h * 0.2)
  const rows = [
    ['add-protons', 'sub-protons'],
    ['add-neutrons', 'sub-neutrons'],
    ['add-electrons', 'sub-electrons'],
  ] as const
  const hits: BucketHit[] = []
  rows.forEach((pair, row) => {
    pair.forEach((id, col) => {
      hits.push({
        id,
        x: x0 + col * (bw + gap),
        y: startY + row * (bh + gap),
        w: bw,
        h: bh,
      })
    })
  })
  return hits
}

function drawAtom(ctx: CanvasRenderingContext2D, w: number, h: number, state: AtomState) {
  fillThemeBackground(ctx, w, h, 'chemistry')
  const cx = w * 0.5
  const cy = h * 0.48

  // Electron shells
  const shells = Math.max(1, Math.ceil(state.electrons / 2) || 1)
  for (let i = 1; i <= Math.min(shells, 3); i++) {
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, 42 + i * 28, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Nucleus glow
  drawGlow(ctx, cx, cy, 36, '#f43f5e', 0.25)

  // Nucleons
  const nucleons: { kind: 'p' | 'n'; angle: number; r: number }[] = []
  for (let i = 0; i < state.protons; i++) {
    nucleons.push({ kind: 'p', angle: (i / Math.max(state.protons, 1)) * Math.PI * 2, r: 10 + (i % 3) * 4 })
  }
  for (let i = 0; i < state.neutrons; i++) {
    nucleons.push({
      kind: 'n',
      angle: Math.PI / 7 + (i / Math.max(state.neutrons, 1)) * Math.PI * 2,
      r: 8 + (i % 3) * 5,
    })
  }
  for (const n of nucleons) {
    const x = cx + Math.cos(n.angle) * Math.min(n.r, 18)
    const y = cy + Math.sin(n.angle) * Math.min(n.r, 18)
    ctx.fillStyle = n.kind === 'p' ? '#ef4444' : '#64748b'
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '700 9px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(n.kind === 'p' ? '+' : '0', x, y + 0.5)
  }

  if (state.protons === 0 && state.neutrons === 0) {
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'
    ctx.beginPath()
    ctx.arc(cx, cy, 16, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Electrons
  for (let i = 0; i < state.electrons; i++) {
    const shell = Math.floor(i / 8) + 1
    const indexInShell = i % 8
    const countInShell = Math.min(8, state.electrons - (shell - 1) * 8)
    const ang = (indexInShell / countInShell) * Math.PI * 2 - Math.PI / 2
    const r = 42 + shell * 28
    const x = cx + Math.cos(ang) * r
    const y = cy + Math.sin(ang) * r
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '700 8px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('−', x, y + 0.5)
  }

  // Symbol card
  const q = netCharge(state)
  ctx.fillStyle = 'rgba(15,23,42,0.9)'
  ctx.fillRect(w * 0.5 - 70, h - 88, 140, 64)
  ctx.strokeStyle = '#64748b'
  ctx.strokeRect(w * 0.5 - 70, h - 88, 140, 64)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(String(massNumber(state)), w * 0.5 - 58, h - 68)
  ctx.fillText(String(state.protons || 0), w * 0.5 - 58, h - 42)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '700 28px Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(elementSymbol(state.protons), w * 0.5 + 8, h - 48)
  if (q !== 0) {
    ctx.font = '600 14px Roboto, sans-serif'
    ctx.fillStyle = q > 0 ? '#f87171' : '#60a5fa'
    ctx.fillText(q > 0 ? `+${q}` : String(q), w * 0.5 + 48, h - 68)
  }

  const colors: Record<string, string> = {
    'add-protons': '#ef4444',
    'sub-protons': '#ef4444',
    'add-neutrons': '#94a3b8',
    'sub-neutrons': '#94a3b8',
    'add-electrons': '#3b82f6',
    'sub-electrons': '#3b82f6',
  }
  const labels: Record<string, string> = {
    'add-protons': 'p +',
    'sub-protons': 'p −',
    'add-neutrons': 'n +',
    'sub-neutrons': 'n −',
    'add-electrons': 'e +',
    'sub-electrons': 'e −',
  }
  for (const b of bucketLayout(w, h)) {
    ctx.fillStyle = 'rgba(15,23,42,0.85)'
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 8)
    ctx.fill()
    ctx.strokeStyle = colors[b.id]
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = colors[b.id]
    ctx.font = '700 14px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labels[b.id], b.x + b.w / 2, b.y + b.h / 2)
  }
}

export function BuildAnAtomSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const [atom, setAtom] = useState<AtomState>(defaultAtomState)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawAtom(ctx, size.w, size.h, atom)
  }, [size.w, size.h, atom])

  useEffect(() => {
    redraw()
  }, [redraw])

  const setCount = (key: keyof AtomState, delta: number) => {
    setAtom((a) => clampAtom({ [key]: a[key] + delta }, a))
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      for (const b of bucketLayout(size.w, size.h)) {
        if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return b.id
      }
      return null
    },
    cursorForHit: () => 'pointer',
    onTap: (id) => {
      if (!id) return
      if (id === 'add-protons') setCount('protons', 1)
      else if (id === 'sub-protons') setCount('protons', -1)
      else if (id === 'add-neutrons') setCount('neutrons', 1)
      else if (id === 'sub-neutrons') setCount('neutrons', -1)
      else if (id === 'add-electrons') setCount('electrons', 1)
      else if (id === 'sub-electrons') setCount('electrons', -1)
    },
  })

  const reset = () => setAtom(defaultAtomState())

  const sidebar = (
    <>
      <h3>Particles</h3>
      {(
        [
          ['protons', 'Protons (+)', MAX_PROTONS, '#ef4444'],
          ['neutrons', 'Neutrons (0)', MAX_NEUTRONS, '#64748b'],
          ['electrons', 'Electrons (−)', MAX_ELECTRONS, '#3b82f6'],
        ] as const
      ).map(([key, label, max, color]) => (
        <div key={key} className="sim-slider-row" style={{ marginBottom: 12 }}>
          <label>
            <span style={{ color }}>{label}</span>
            <span>
              {atom[key]} / {max}
            </span>
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="sim-btn" onClick={() => setCount(key, -1)}>
              −
            </button>
            <input
              type="range"
              min={0}
              max={max}
              value={atom[key]}
              onChange={(e) => setAtom((a) => clampAtom({ [key]: Number(e.target.value) }, a))}
              style={{ flex: 1 }}
            />
            <button type="button" className="sim-btn" onClick={() => setCount(key, 1)}>
              +
            </button>
          </div>
        </div>
      ))}
      <p className="sim-readout">
        <strong>{elementName(atom.protons)}</strong>
        <br />
        Mass number A = {massNumber(atom)}
        <br />
        Net charge = {chargeLabel(netCharge(atom))}
      </p>
      <button type="button" className="sim-btn sim-btn-ghost" onClick={reset}>
        Reset
      </button>
    </>
  )

  return (
    <SimShell
      title="Build an Atom"
      subtitle="PhET bucket limits — up to 10 p, 13 n, 10 e"
      canvasRef={canvasRef}
      sidebar={sidebar}
    />
  )
}
