import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlToggle } from '../../shared/Controls'
import { drawBadge, fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export function createNeuronState() {
  return { t: 0 }
}

export function NeuronSignalSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createNeuronState())
  const [running, setRunning] = useState(true)
  const [myelin, setMyelin] = useState(true)
  const [version, setVersion] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const speed = myelin ? 1.25 : 0.42
      if (dt > 0 && running) stateRef.current.t += dt * speed
      const t = stateRef.current.t % 1
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0f2740')
      bg.addColorStop(1, '#1b3a55')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const y = h * 0.5
      const x0 = w * 0.1
      const x1 = w * 0.9

      ctx.fillStyle = '#5dade2'
      ctx.beginPath()
      ctx.arc(x0, y, Math.min(w, h) * 0.045, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + i * 0.45
        ctx.strokeStyle = '#5dade2'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(x0, y)
        ctx.lineTo(x0 + Math.cos(a) * 42, y + Math.sin(a) * 42)
        ctx.stroke()
      }

      ctx.strokeStyle = '#85c1e9'
      ctx.lineWidth = Math.max(8, Math.min(w, h) * 0.02)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x0 + 24, y)
      ctx.lineTo(x1 - 36, y)
      ctx.stroke()

      if (myelin) {
        const segs = 8
        for (let i = 0; i < segs; i++) {
          const xa = x0 + 48 + i * ((x1 - x0 - 100) / segs)
          const xb = xa + ((x1 - x0 - 100) / segs) * 0.62
          ctx.strokeStyle = '#f5b041'
          ctx.lineWidth = Math.max(14, Math.min(w, h) * 0.032)
          ctx.beginPath()
          ctx.moveTo(xa, y)
          ctx.lineTo(xb, y)
          ctx.stroke()
        }
      }

      ctx.fillStyle = '#58d68d'
      ctx.beginPath()
      ctx.moveTo(x1 - 36, y - 16)
      ctx.lineTo(x1, y)
      ctx.lineTo(x1 - 36, y + 16)
      ctx.closePath()
      ctx.fill()

      const x = x0 + 26 + t * (x1 - x0 - 62)
      ctx.save()
      ctx.shadowColor = '#f4d03f'
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#f4d03f'
      ctx.fill()
      ctx.restore()

      drawBadge(ctx, myelin ? 'Myelinated — fast' : 'Unmyelinated — slower', 12, 20, {
        font: `${fs}px Roboto, sans-serif`,
        bg: myelin ? 'rgba(241,196,15,0.9)' : 'rgba(52,152,219,0.85)',
        fg: myelin ? '#1a1a1a' : '#fff',
      })
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('Soma → axon → synaptic terminal', 14, h - 14)
    },
    [myelin, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Neuron Signal Transmission"
      subtitle="Action potential travel and the effect of myelin"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createNeuronState()
        setMyelin(true)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Axon">
            <ControlHint>Myelin lets the impulse jump between gaps (saltatory conduction).</ControlHint>
            <ControlToggle label="Myelin sheath" checked={myelin} onChange={setMyelin} />
          </ControlSection>
        </>
      }
    />
  )
}
