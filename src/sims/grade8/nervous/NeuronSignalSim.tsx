import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlToggle } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { createNeuronState, stepNeuron } from './neuronSignalModel'

export function NeuronSignalSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createNeuronState())
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [myelin, setMyelin] = useState(true)
  const [version, setVersion] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepNeuron(stateRef.current, dt, myelin, running)
      const t = stateRef.current.t % 1
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0b1c2e')
      bg.addColorStop(1, '#16324f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const y = h * 0.52
      const x0 = w * 0.12
      const x1 = w * 0.9

      // Soma
      ctx.fillStyle = '#5dade2'
      ctx.beginPath()
      ctx.arc(x0, y, Math.min(w, h) * 0.055, 0, Math.PI * 2)
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
        // Nodes of Ranvier gaps
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

      if (hintShown.current) {
        drawHint(ctx, 'toggle myelin sheath in controls', w / 2, h - 16, w, h, { muted: true })
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
                stateRef.current.t = 0
              }}
            />
          </ControlSection>
        </>
      }
    />
  )
}
