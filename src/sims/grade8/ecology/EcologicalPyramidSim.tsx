import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { drawBadge, fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

export function createPyramidState() {
  return { baseEnergy: 10000, pulse: 0 }
}

export function EcologicalPyramidSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPyramidState())
  const [running, setRunning] = useState(true)
  const [base, setBase] = useState(10000)
  const [version, setVersion] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current.pulse += dt
      stateRef.current.baseEnergy = base
      const E = [base, base * 0.1, base * 0.01, base * 0.001]
      const labels = ['Producers', 'Primary consumers', 'Secondary', 'Tertiary']
      const colors = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b']
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0e2433')
      bg.addColorStop(1, '#1a3324')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const top = h * 0.1
      const bottom = h * 0.82
      const levels = 4
      const band = (bottom - top) / levels

      for (let i = 0; i < levels; i++) {
        const t = i / (levels - 1)
        const widthFrac = 0.28 + (1 - t) * 0.55
        const hw = (w * widthFrac) / 2
        const y = top + i * band
        const cx = w / 2
        ctx.beginPath()
        ctx.moveTo(cx - hw, y + band - 10)
        ctx.lineTo(cx + hw, y + band - 10)
        ctx.lineTo(cx + hw * 0.72, y + 10)
        ctx.lineTo(cx - hw * 0.72, y + 10)
        ctx.closePath()
        ctx.fillStyle = colors[i]
        ctx.globalAlpha = 0.88 + 0.08 * Math.sin(stateRef.current.pulse * 2 + i)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#fff'
        ctx.font = `600 ${fs}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labels[i], cx, y + band / 2 - fs * 0.35)
        ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
        ctx.fillText(`${formatEnergy(E[i])} units`, cx, y + band / 2 + fs * 0.65)
      }

      drawBadge(ctx, '~10% energy passes up each level', 12, h - 18, {
        font: `${fontPx(11, w, h, 10, 13)}px Roboto, sans-serif`,
        bg: 'rgba(0,0,0,0.55)',
      })
    },
    [base, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Ecological Pyramid"
      subtitle="The 10% rule — energy shrinks at each trophic level"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPyramidState()
        setBase(10000)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Energy base">
            <ControlHint>Only about 10% of energy moves to the next level; the rest is lost as heat.</ControlHint>
            <ControlSlider
              label="Producer energy"
              value={base}
              min={1000}
              max={50000}
              step={500}
              display={formatEnergy(base)}
              onChange={setBase}
            />
          </ControlSection>
          <ControlSection title="Outcomes">
            <ControlStats>
              <ControlStat label="Base" value={formatEnergy(base)} />
              <ControlStat label="Top predator" value={formatEnergy(base * 0.001)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}

function formatEnergy(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
}
