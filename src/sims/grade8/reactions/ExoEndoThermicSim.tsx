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
  createThermicState,
  resetThermicState,
  stepThermic,
  type ThermicMode,
} from './exoEndoModel'

export function ExoEndoThermicSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createThermicState())
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<ThermicMode>('exothermic')
  const [version, setVersion] = useState(0)
  const [tempReadout, setTempReadout] = useState(22)

  useEffect(() => {
    const id = window.setInterval(() => setTempReadout(stateRef.current.temperature), 150)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepThermic(stateRef.current, dt, mode, running)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const isExo = mode === 'exothermic'

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(isExo ? 'Exothermic — releases heat' : 'Endothermic — absorbs heat', w / 2, 28)

      const bx = w * 0.38
      const by = h * 0.38
      const bw = w * 0.24
      const bh = h * 0.38

      ctx.strokeStyle = '#5dade2'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(bx + bw * 0.15, by)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx, by + bh)
      ctx.lineTo(bx + bw, by + bh)
      ctx.lineTo(bx + bw, by)
      ctx.lineTo(bx + bw * 0.85, by)
      ctx.stroke()

      const liquidLevel = 0.35 + ((s.temperature - 8) / 40) * 0.45
      const liquidY = by + bh * (1 - liquidLevel)
      ctx.fillStyle = isExo ? 'rgba(231,76,60,0.55)' : 'rgba(52,152,219,0.55)'
      ctx.fillRect(bx + 3, liquidY, bw - 6, by + bh - liquidY - 3)

      ctx.fillStyle = '#5d6d7e'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillText('Beaker', bx + bw / 2, by + bh + fs + 10)

      const tx = bx + bw + w * 0.08
      const ty = by + bh * 0.15
      const th = bh * 0.85
      ctx.fillStyle = '#ecf0f1'
      ctx.fillRect(tx, ty, 14, th)
      ctx.strokeStyle = '#566573'
      ctx.lineWidth = 2
      ctx.strokeRect(tx, ty, 14, th)

      const tempNorm = (s.temperature - 8) / 40
      const mercuryH = th * Math.max(0.08, Math.min(0.95, tempNorm))
      ctx.fillStyle = isExo ? '#e74c3c' : '#3498db'
      ctx.fillRect(tx + 2, ty + th - mercuryH, 10, mercuryH)

      ctx.beginPath()
      ctx.arc(tx + 7, ty + th + 12, 14, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(`${s.temperature.toFixed(1)} °C`, tx + 28, ty + th * 0.5)

      const arrowX = w * 0.12
      const arrowY = h * 0.55
      ctx.strokeStyle = isExo ? '#e74c3c' : '#3498db'
      ctx.fillStyle = isExo ? '#e74c3c' : '#3498db'
      ctx.lineWidth = 4
      ctx.beginPath()
      if (isExo) {
        ctx.moveTo(arrowX, arrowY - 50)
        ctx.lineTo(arrowX, arrowY + 30)
        ctx.lineTo(arrowX - 12, arrowY + 10)
        ctx.moveTo(arrowX, arrowY + 30)
        ctx.lineTo(arrowX + 12, arrowY + 10)
      } else {
        ctx.moveTo(arrowX, arrowY + 30)
        ctx.lineTo(arrowX, arrowY - 50)
        ctx.lineTo(arrowX - 12, arrowY - 30)
        ctx.moveTo(arrowX, arrowY - 50)
        ctx.lineTo(arrowX + 12, arrowY - 30)
      }
      ctx.stroke()
      ctx.fill()

      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(isExo ? 'Energy OUT' : 'Energy IN', arrowX, arrowY + 58)

      if (running) {
        const bubbles = isExo ? 8 : 4
        for (let i = 0; i < bubbles; i++) {
          const phase = (s.time * 1.2 + i * 0.37) % 1
          const bx2 = bx + bw * 0.2 + (i % 3) * (bw * 0.25)
          const by2 = liquidY - phase * (liquidY - by) * 0.8
          ctx.beginPath()
          ctx.arc(bx2, by2, 3 + (i % 2), 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.fill()
        }
      }

      roundRect(ctx, w * 0.55, h * 0.68, w * 0.38, h * 0.22, 10)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#5d6d7e'
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      const note = isExo
        ? 'Bonds form → energy released\nSurroundings get warmer'
        : 'Bonds break → energy absorbed\nSurroundings get cooler'
      note.split('\n').forEach((line, i) => {
        ctx.fillText(line, w * 0.55 + 12, h * 0.68 + fs + 8 + i * (fs + 4))
      })
    },
    [mode, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Exothermic vs Endothermic"
      subtitle="Energy flow and temperature change during reactions"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = resetThermicState()
        setMode('exothermic')
        setRunning(true)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Reaction type">
            <ControlHint>Play to watch the thermometer respond over time.</ControlHint>
            <ControlSelect
              label="Energy change"
              value={mode}
              options={[
                { value: 'exothermic', label: 'Exothermic (heat out)' },
                { value: 'endothermic', label: 'Endothermic (heat in)' },
              ]}
              onChange={(v) => {
                setMode(v as ThermicMode)
                stateRef.current = resetThermicState()
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
          <ControlSection title="Reading">
            <ControlStats>
              <ControlStat label="Temperature" value={`${tempReadout.toFixed(1)} °C`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
