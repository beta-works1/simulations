import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export function createPlasmidState() {
  return { t: 0, stage: 0 }
}

export function PlasmidInsertionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPlasmidState())
  const [running, setRunning] = useState(true)
  const [version, setVersion] = useState(0)
  const [stageLabel, setStageLabel] = useState(0)

  const stages = ['Cut plasmid', 'Insert gene', 'Join recombinant DNA', 'Insert into bacterium', 'Replication']

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    if (dt > 0 && running) {
      stateRef.current.t += dt
      if (stateRef.current.t > 1.6) {
        stateRef.current.t = 0
        stateRef.current.stage = (stateRef.current.stage + 1) % stages.length
        setStageLabel(stateRef.current.stage)
      }
    }
    const stage = stateRef.current.stage
    const f = stateRef.current.t / 1.6

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#102a20'
    ctx.fillRect(0, 0, w, h)

    const cx = w * 0.35
    const cy = h * 0.5

    // plasmid ring
    ctx.strokeStyle = '#58d68d'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(cx, cy, 70, 0, Math.PI * 2)
    ctx.stroke()

    if (stage >= 0) {
      const gap = stage === 0 ? f * 0.4 : stage > 0 ? 0.4 : 0
      ctx.strokeStyle = '#102a20'
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.arc(cx, cy, 70, -gap, gap)
      ctx.stroke()
    }

    // gene fragment
    const geneX = stage < 1 ? w * 0.75 : cx + 70 * Math.cos(-0.2) - f * (stage === 1 ? 40 : 0)
    const geneY = stage < 1 ? h * 0.3 : cy
    ctx.fillStyle = '#f4d03f'
    ctx.fillRect(geneX - 40, geneY - 8, 80, 16)
    ctx.fillStyle = '#1a252f'
    ctx.font = '11px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Target gene', geneX, geneY - 14)

    if (stage >= 2) {
      ctx.strokeStyle = '#f4d03f'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(cx, cy, 70, -0.35, 0.35)
      ctx.stroke()
    }

    // bacterium
    const bx = w * 0.75
    const by = h * 0.65
    ctx.beginPath()
    ctx.ellipse(bx, by, 70, 40, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#1abc9c'
    ctx.fill()
    ctx.fillStyle = '#0e6655'
    ctx.font = '600 12px Roboto, sans-serif'
    ctx.fillText('Bacterium', bx, by + 4)

    if (stage >= 3) {
      const px = stage === 3 ? cx + (bx - cx) * f : bx
      const py = stage === 3 ? cy + (by - cy) * f : by
      ctx.strokeStyle = '#58d68d'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(px, py, 22, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = '#f4d03f'
      ctx.beginPath()
      ctx.arc(px, py, 22, -0.35, 0.35)
      ctx.stroke()
    }

    if (stage >= 4) {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = '#58d68d'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(bx - 40 + i * 40, by - 50 - Math.sin(f * Math.PI + i) * 8, 14, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    ctx.fillStyle = '#ecf0f1'
    ctx.font = '600 15px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Step ${stage + 1}: ${stages[stage]}`, 16, 28)
  }, [running])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Genetic Engineering / Plasmid"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPlasmidState()
        setStageLabel(0)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">
            Follow restriction cut → gene insert → recombinant plasmid → bacterial transformation →
            copies.
          </p>
          <div className="stat">
            <span>Step</span>
            <strong>
              {stageLabel + 1}/{stages.length}
            </strong>
          </div>
        </>
      }
    />
  )
}
