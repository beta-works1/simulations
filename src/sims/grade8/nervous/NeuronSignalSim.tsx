import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlToggle } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import { createNeuronState, fireNeuron, stepNeuron } from './neuronSignalModel'

type Layout = {
  soma: { x: number; y: number; r: number }
  fireBtn: { x: number; y: number; w: number; h: number }
}

export function NeuronSignalSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createNeuronState())
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [myelin, setMyelin] = useState(true)
  const [version, setVersion] = useState(0)

  const doFire = () => {
    hintShown.current = false
    stateRef.current = fireNeuron(stateRef.current)
    setVersion((v) => v + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.soma.x, pt.y - L.soma.y) < L.soma.r + 12) return 'soma'
      const b = L.fireBtn
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return 'fire'
      return null
    },
    cursorForHit: () => 'pointer',
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (id === 'soma' || id === 'fire') doFire()
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepNeuron(stateRef.current, dt, myelin, running)
      const t = stateRef.current.t % 1
      const fs = fontPx(13, w, h)
      const hover = hoverRef.current

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0b1c2e')
      bg.addColorStop(1, '#16324f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const y = h * 0.52
      const x0 = w * 0.12
      const x1 = w * 0.9
      const somaR = Math.min(w, h) * 0.055

      // Soma
      drawHoverHalo(ctx, x0, y, somaR + 10, hover === 'soma')
      ctx.fillStyle = '#5dade2'
      ctx.beginPath()
      ctx.arc(x0, y, somaR, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#85c1e9'
      ctx.lineWidth = 2
      ctx.stroke()
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.85 + i * 0.35
        ctx.strokeStyle = '#5dade2'
        ctx.lineWidth = 3.5
        ctx.beginPath()
        ctx.moveTo(x0 + Math.cos(a) * 18, y + Math.sin(a) * 18)
        ctx.lineTo(x0 + Math.cos(a) * 48, y + Math.sin(a) * 48)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x0 + Math.cos(a) * 50, y + Math.sin(a) * 50, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#85c1e9'
        ctx.fill()
      }
      drawLabelPill(ctx, 'soma (cell body)', x0, y - Math.min(w, h) * 0.09, {
        fontSize: Math.max(10, fs - 2),
      })
      drawLabelPill(ctx, 'Tap to fire', x0, y + somaR + 20, {
        fontSize: Math.max(10, fs - 2),
        bold: false,
        bg: hover === 'soma' ? 'rgba(93,173,226,0.35)' : undefined,
      })

      // Axon core
      ctx.strokeStyle = '#a9cce3'
      ctx.lineWidth = Math.max(10, Math.min(w, h) * 0.022)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x0 + 28, y)
      ctx.lineTo(x1 - 48, y)
      ctx.stroke()
      drawLabelPill(ctx, 'axon', (x0 + x1) / 2, y - 36, { fontSize: Math.max(10, fs - 2) })

      const segCount = 7
      const ax0 = x0 + 52
      const ax1 = x1 - 56
      const span = ax1 - ax0

      if (myelin) {
        for (let i = 0; i < segCount; i++) {
          const xa = ax0 + i * (span / segCount) + 4
          const xb = xa + (span / segCount) * 0.72
          ctx.strokeStyle = '#f5b041'
          ctx.lineWidth = Math.max(16, Math.min(w, h) * 0.036)
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(xa, y)
          ctx.lineTo(xb, y)
          ctx.stroke()
        }
        for (let i = 1; i < segCount; i++) {
          const nx = ax0 + i * (span / segCount)
          ctx.fillStyle = '#1b4f72'
          ctx.fillRect(nx - 3, y - 10, 6, 20)
        }
        drawLabelPill(ctx, 'myelin sheath', (x0 + x1) / 2, y + 40, {
          fontSize: Math.max(10, fs - 2),
          bg: 'rgba(245,176,65,0.25)',
        })
        drawLabelPill(ctx, 'node of Ranvier', ax0 + span * 0.28, y + 62, {
          fontSize: Math.max(9, fs - 3),
          bold: false,
        })
      } else {
        drawLabelPill(ctx, 'unmyelinated — continuous conduction', (x0 + x1) / 2, y + 40, {
          fontSize: Math.max(10, fs - 2),
        })
      }

      // Synaptic terminal
      ctx.fillStyle = '#58d68d'
      ctx.beginPath()
      ctx.moveTo(x1 - 48, y - 18)
      ctx.lineTo(x1 - 8, y)
      ctx.lineTo(x1 - 48, y + 18)
      ctx.closePath()
      ctx.fill()
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(x1 - 4, y - 12 + i * 12, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
      drawLabelPill(ctx, 'synaptic terminal', x1 - 20, y - 40, {
        fontSize: Math.max(10, fs - 2),
      })

      // Impulse + trail
      const x = ax0 + t * (ax1 - ax0 - 10)
      ctx.strokeStyle = 'rgba(244,208,63,0.4)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(Math.max(ax0, x - 40), y)
      ctx.lineTo(x, y)
      ctx.stroke()

      ctx.save()
      ctx.shadowColor = '#f4d03f'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(x, y, 11, 0, Math.PI * 2)
      ctx.fillStyle = '#f4d03f'
      ctx.fill()
      ctx.restore()
      drawValueChip(ctx, 'AP', `${Math.round(t * 100)}%`, x, y - 28, {
        fontSize: Math.max(10, fs - 1),
        accent: true,
      })

      drawValueChip(
        ctx,
        '',
        myelin ? 'Saltatory — jumps node to node (fast)' : 'Continuous — slower propagation',
        16,
        24,
        { align: 'left', fontSize: fs },
      )

      // Fire signal button
      const btnW = 110
      const btnH = 32
      const btnX = w - btnW - 16
      const btnY = 16
      const fireHover = hover === 'fire'
      ctx.fillStyle = fireHover ? 'rgba(231,76,60,0.85)' : 'rgba(192,57,43,0.75)'
      roundRect(ctx, btnX, btnY, btnW, btnH, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = `600 ${Math.max(11, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Fire signal', btnX + btnW / 2, btnY + btnH / 2)

      layoutRef.current = {
        soma: { x: x0, y, r: somaR },
        fireBtn: { x: btnX, y: btnY, w: btnW, h: btnH },
      }

      if (hintShown.current) {
        drawHint(ctx, 'tap soma or Fire signal · toggle myelin in controls', w / 2, h - 16, w, h, {
          muted: true,
        })
      }
    },
    [myelin, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Neuron Signal Transmission"
      subtitle="Watch an action potential travel — myelin speeds it up"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createNeuronState()
        setMyelin(true)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Axon">
            <ControlHint>
              Myelin lets the impulse jump between gaps (nodes of Ranvier) — saltatory conduction.
            </ControlHint>
            <ControlToggle
              label="Myelin sheath"
              checked={myelin}
              onChange={(v) => {
                setMyelin(v)
                hintShown.current = false
                stateRef.current = fireNeuron(stateRef.current)
              }}
            />
          </ControlSection>
        </>
      }
    />
  )
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
