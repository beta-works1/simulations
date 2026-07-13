import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export function createNeuronState() {
  return { t: 0, myelin: true, speed: 1 }
}

export function NeuronSignalSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createNeuronState())
  const [running, setRunning] = useState(true)
  const [myelin, setMyelin] = useState(true)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    const speed = myelin ? 1.2 : 0.45
    if (dt > 0 && running) stateRef.current.t += dt * speed
    const t = stateRef.current.t % 1

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f2740'
    ctx.fillRect(0, 0, w, h)

    const y = h * 0.5
    const x0 = w * 0.08
    const x1 = w * 0.92

    // dendrites / soma
    ctx.fillStyle = '#5dade2'
    ctx.beginPath()
    ctx.arc(x0, y, 22, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + i * 0.45
      ctx.strokeStyle = '#5dade2'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(x0 + Math.cos(a) * 40, y + Math.sin(a) * 40)
      ctx.stroke()
    }

    // axon
    ctx.strokeStyle = '#85c1e9'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(x0 + 22, y)
    ctx.lineTo(x1 - 30, y)
    ctx.stroke()

    if (myelin) {
      const segs = 8
      for (let i = 0; i < segs; i++) {
        const xa = x0 + 40 + i * ((x1 - x0 - 80) / segs)
        const xb = xa + ((x1 - x0 - 80) / segs) * 0.65
        ctx.strokeStyle = '#f5b041'
        ctx.lineWidth = 16
        ctx.beginPath()
        ctx.moveTo(xa, y)
        ctx.lineTo(xb, y)
        ctx.stroke()
      }
    }

    // terminal
    ctx.fillStyle = '#58d68d'
    ctx.beginPath()
    ctx.moveTo(x1 - 30, y - 14)
    ctx.lineTo(x1, y)
    ctx.lineTo(x1 - 30, y + 14)
    ctx.closePath()
    ctx.fill()

    // impulse
    const x = x0 + 22 + t * (x1 - x0 - 52)
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#f4d03f'
    ctx.shadowColor = '#f4d03f'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#d5dbdb'
    ctx.font = '13px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(myelin ? 'Myelinated — saltatory (fast)' : 'Unmyelinated — continuous (slower)', 16, 24)
    ctx.fillText('Soma → axon → synaptic terminal', 16, h - 14)
  }, [myelin, running])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Neuron Signal Transmission"
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
          <p className="hint">Watch an action potential travel; myelin increases speed.</p>
          <label>
            <span>
              <input type="checkbox" checked={myelin} onChange={(e) => setMyelin(e.target.checked)} />{' '}
              Myelin sheath
            </span>
          </label>
        </>
      }
    />
  )
}
