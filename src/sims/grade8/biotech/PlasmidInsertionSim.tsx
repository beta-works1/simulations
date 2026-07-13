import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export function createPlasmidState() {
  return { t: 0, stage: 0 }
}

const STAGES = [
  'Cut plasmid',
  'Insert gene',
  'Join recombinant DNA',
  'Insert into bacterium',
  'Replication',
]

export function PlasmidInsertionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPlasmidState())
  const [running, setRunning] = useState(true)
  const [version, setVersion] = useState(0)
  const [stageLabel, setStageLabel] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) {
        stateRef.current.t += dt
        if (stateRef.current.t > 1.65) {
          stateRef.current.t = 0
          stateRef.current.stage = (stateRef.current.stage + 1) % STAGES.length
          setStageLabel(stateRef.current.stage)
        }
      }
      const stage = stateRef.current.stage
      const f = stateRef.current.t / 1.65
      const fs = fontPx(13, w, h)

      ctx.fillStyle = '#102a20'
      ctx.fillRect(0, 0, w, h)

      const cx = w * 0.34
      const cy = h * 0.5
      const ringR = Math.min(w, h) * 0.14

      ctx.strokeStyle = '#58d68d'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
      ctx.stroke()

      const gap = stage === 0 ? f * 0.4 : stage > 0 ? 0.4 : 0
      if (gap > 0) {
        ctx.strokeStyle = '#102a20'
        ctx.lineWidth = 12
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, -gap, gap)
        ctx.stroke()
      }

      const geneX = stage < 1 ? w * 0.74 : cx + ringR * Math.cos(-0.2)
      const geneY = stage < 1 ? h * 0.28 : cy
      ctx.fillStyle = '#f4d03f'
      ctx.fillRect(geneX - 42, geneY - 9, 84, 18)
      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Target gene', geneX, geneY - 16)

      if (stage >= 2) {
        ctx.strokeStyle = '#f4d03f'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, -0.35, 0.35)
        ctx.stroke()
      }

      const bx = w * 0.74
      const by = h * 0.66
      ctx.beginPath()
      ctx.ellipse(bx, by, Math.min(w, h) * 0.12, Math.min(w, h) * 0.07, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1abc9c'
      ctx.fill()
      ctx.fillStyle = '#0e6655'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.fillText('Bacterium', bx, by + 4)

      if (stage >= 3) {
        const px = stage === 3 ? cx + (bx - cx) * f : bx
        const py = stage === 3 ? cy + (by - cy) * f : by
        ctx.strokeStyle = '#58d68d'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(px, py, 20, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = '#f4d03f'
        ctx.beginPath()
        ctx.arc(px, py, 20, -0.35, 0.35)
        ctx.stroke()
      }

      if (stage >= 4) {
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = '#58d68d'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(bx - 42 + i * 42, by - 52 - Math.sin(f * Math.PI + i) * 8, 13, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      ctx.fillStyle = '#ecf0f1'
      ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(`Step ${stage + 1}: ${STAGES[stage]}`, 14, 28)
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Genetic Engineering"
      subtitle="Plasmid cut → gene insert → bacterial transformation"
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
          <ControlSection title="Process">
            <ControlHint>
              Follow restriction cut, insert, ligation, transformation, then copies.
            </ControlHint>
            <ControlStats>
              <ControlStat label="Step" value={`${stageLabel + 1} / ${STAGES.length}`} />
              <ControlStat label="Current" value={STAGES[stageLabel]} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
