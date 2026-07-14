import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlPanel,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../sims/shared/Controls'
import { SimShell } from '../../sims/shared/SimShell'
import { useCanvasLoop } from '../../sims/shared/useCanvasLoop'
import { defaultBalanceStubState, tipDirection, type BalanceStubState } from './model'

export function IntroBalanceScaleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<BalanceStubState>(defaultBalanceStubState())
  const [ui, setUi] = useState(defaultBalanceStubState)
  const [version, setVersion] = useState(0)

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const s = stateRef.current
    const tip = tipDirection(s)
    ctx.fillStyle = '#f5f7fa'
    ctx.fillRect(0, 0, w, h)

    const cx = w / 2
    const cy = h * 0.55
    const tilt = tip === 'level' ? 0 : tip === 'left' ? -0.18 : 0.18

    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(cx, cy + 10)
    ctx.lineTo(cx, cy + h * 0.22)
    ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(tilt)
    ctx.beginPath()
    ctx.moveTo(-w * 0.28, 0)
    ctx.lineTo(w * 0.28, 0)
    ctx.stroke()
    ctx.fillStyle = '#e74c3c'
    ctx.beginPath()
    ctx.arc(-w * 0.22, 28, 18 + s.leftMass * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3498db'
    ctx.beginPath()
    ctx.arc(w * 0.22, 28, 18 + s.rightMass * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = '#152033'
    ctx.font = '600 14px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Balance Scale (Grade 6 stub)', cx, 28)
    ctx.font = '13px Roboto, sans-serif'
    ctx.fillText(
      tip === 'level' ? 'Level — equal masses' : tip === 'left' ? 'Tips left' : 'Tips right',
      cx,
      h - 24,
    )
  }, [])

  useCanvasLoop(canvasRef, draw, true, version, true)

  return (
    <SimShell
      title="Balance Scale (Intro)"
      subtitle="Grade 6 stub — framework extensibility demo"
      canvasRef={canvasRef}
      running
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        stateRef.current = defaultBalanceStubState()
        setUi(defaultBalanceStubState())
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlPanel title="Masses">
            <ControlHint>This is a placeholder sim for Grade 6 in the registry.</ControlHint>
            <ControlSlider
              label="Left mass"
              value={ui.leftMass}
              min={1}
              max={8}
              step={0.5}
              unit=" kg"
              onChange={(v) => {
                stateRef.current = { ...stateRef.current, leftMass: v }
                setUi({ ...stateRef.current })
                setVersion((n) => n + 1)
              }}
            />
            <ControlSlider
              label="Right mass"
              value={ui.rightMass}
              min={1}
              max={8}
              step={0.5}
              unit=" kg"
              onChange={(v) => {
                stateRef.current = { ...stateRef.current, rightMass: v }
                setUi({ ...stateRef.current })
                setVersion((n) => n + 1)
              }}
            />
          </ControlPanel>
          <ControlPanel title="Result">
            <ControlStats>
              <ControlStat label="Tip" value={tipDirection(ui)} />
            </ControlStats>
          </ControlPanel>
        </>
      }
    />
  )
}
