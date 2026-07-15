import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, withShadow } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  createMitosisMeiosisState,
  stagesForMode,
  stepMitosisMeiosis,
  type DivisionMode,
} from './mitosisMeiosisModel'

export function MitosisMeiosisSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<DivisionMode>('mitosis')
  const stateRef = useRef(createMitosisMeiosisState())
  const [version, setVersion] = useState(0)
  const [stageLabel, setStageLabel] = useState(0)

  const stages = stagesForMode(mode)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const prev = stateRef.current.stage
      stateRef.current = stepMitosisMeiosis(stateRef.current, dt, running, stages.length)
      if (stateRef.current.stage !== prev) setStageLabel(stateRef.current.stage)
      const stage = stateRef.current.stage
      const fs = fontPx(14, w, h)

      clearThemedScene(ctx, w, h, 'biology')

      const cx = w / 2
      const cy = h * 0.52
      const cellR = Math.min(w, h) * 0.3

      withShadow(ctx, () => {
        ctx.beginPath()
        ctx.arc(cx, cy, cellR, 0, Math.PI * 2)
        ctx.fillStyle = '#d6eaf8'
        ctx.fill()
      })
      ctx.strokeStyle = '#5dade2'
      ctx.lineWidth = 4
      ctx.stroke()

      const nChrom = 4
      const progress = stage / Math.max(1, stages.length - 1)

      for (let i = 0; i < nChrom; i++) {
        const baseAngle = (i / nChrom) * Math.PI * 2
        let x = cx
        let y = cy
        if (stage <= 1) {
          x = cx + Math.cos(baseAngle) * cellR * 0.35
          y = cy + Math.sin(baseAngle) * cellR * 0.35
        } else if (mode === 'mitosis' && stage === 2) {
          x = cx + (i % 2 === 0 ? -1 : 1) * cellR * 0.45
          y = cy + (i - 1.5) * 18
        } else if (mode === 'mitosis' && stage >= 3) {
          const side = i < 2 ? -1 : 1
          x = cx + side * cellR * (0.55 + progress * 0.1)
          y = cy + ((i % 2) - 0.5) * 30
        } else if (mode === 'meiosis') {
          if (stage <= 2) {
            x = cx + Math.cos(baseAngle) * cellR * (0.2 + stage * 0.1)
            y = cy + Math.sin(baseAngle) * cellR * (0.2 + stage * 0.1)
          } else {
            x = cx + (i % 2 === 0 ? -1 : 1) * cellR * 0.55
            y = cy + (i < 2 ? -1 : 1) * cellR * 0.45
          }
        }

        ctx.strokeStyle = i % 2 === 0 ? '#c0392b' : '#8e44ad'
        ctx.lineWidth = 5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x - 10, y - 16)
        ctx.quadraticCurveTo(x, y, x + 10, y + 16)
        ctx.stroke()
        if (mode === 'mitosis' && stage < 2) {
          ctx.beginPath()
          ctx.moveTo(x + 6, y - 16)
          ctx.quadraticCurveTo(x + 14, y, x + 22, y + 16)
          ctx.stroke()
        }
      }

      if ((mode === 'mitosis' && stage >= 4) || (mode === 'meiosis' && stage >= 5)) {
        ctx.strokeStyle = '#85929e'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, cy - cellR)
        ctx.lineTo(cx, cy + cellR)
        if (mode === 'meiosis') {
          ctx.moveTo(cx - cellR, cy)
          ctx.lineTo(cx + cellR, cy)
        }
        ctx.stroke()
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 1}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`${mode === 'mitosis' ? 'Mitosis' : 'Meiosis'} — ${stages[stage]}`, w / 2, 26)
      ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText(
        mode === 'mitosis'
          ? 'Produces 2 identical diploid cells'
          : 'Produces 4 genetically unique haploid gametes',
        w / 2,
        h - 16,
      )
    },
    [mode, running, stages],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Mitosis vs Meiosis"
      subtitle="Compare chromosome stages and final cell products"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createMitosisMeiosisState()
        setStageLabel(0)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Process">
            <ControlHint>Switch between mitosis and meiosis to compare outcomes.</ControlHint>
            <ControlSelect
              label="Division type"
              value={mode}
              options={[
                { value: 'mitosis', label: 'Mitosis' },
                { value: 'meiosis', label: 'Meiosis' },
              ]}
              onChange={(v) => {
                setMode(v as DivisionMode)
                stateRef.current = createMitosisMeiosisState()
                setStageLabel(0)
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
          <ControlSection title="Progress">
            <ControlStats>
              <ControlStat label="Stage" value={`${stageLabel + 1} / ${stages.length}`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
