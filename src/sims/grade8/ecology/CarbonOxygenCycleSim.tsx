import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { drawBadge, drawLegend, fillFittedText, fontPx } from '../../shared/drawHelpers'
import { drawHint, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  createCarbonOxygenState,
  stepCarbonOxygen,
  type CarbonOxygenState,
} from './carbonOxygenModel'

export function CarbonOxygenCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CarbonOxygenState>(createCarbonOxygenState())
  const [running, setRunning] = useState(true)
  const [photo, setPhoto] = useState(0.55)
  const [resp, setResp] = useState(0.4)
  const [tick, setTick] = useState(0)
  const [readout, setReadout] = useState({ co2: 55, o2: 70 })

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      setReadout({ co2: s.co2, o2: s.o2 })
    }, 200)
    return () => clearInterval(id)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const s = stateRef.current
      s.photosynthesisRate = photo
      s.respirationRate = resp
      if (dt > 0 && running) stateRef.current = stepCarbonOxygen(s, dt)
      const st = stateRef.current

      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, '#7ec8e3')
      sky.addColorStop(0.45, '#c5e8b8')
      sky.addColorStop(1, '#6aaa4f')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const fs = fontPx(14, w, h)
      drawPool(ctx, w * 0.5, h * 0.2, Math.min(w, h) * 0.12, '#3d8fd1', 'Atmosphere', `CO₂ ${st.co2.toFixed(0)}  ·  O₂ ${st.o2.toFixed(0)}`, fs)
      drawPool(ctx, w * 0.22, h * 0.66, Math.min(w, h) * 0.1, '#2a9d5c', 'Plants', `Carbon ${st.plantCarbon.toFixed(0)}`, fs)
      drawPool(ctx, w * 0.78, h * 0.66, Math.min(w, h) * 0.1, '#e67e22', 'Animals', `Carbon ${st.animalCarbon.toFixed(0)}`, fs)

      const t = st.time
      drawFlow(ctx, w * 0.5, h * 0.32, w * 0.3, h * 0.55, '#1e8449', t, 'Photosynthesis\nCO₂→O₂', fs)
      drawFlow(ctx, w * 0.7, h * 0.55, w * 0.55, h * 0.32, '#c0392b', t + 1.1, 'Respiration\nO₂→CO₂', fs)
      drawFlow(ctx, w * 0.35, h * 0.72, w * 0.65, h * 0.72, '#d68910', t + 0.5, 'Food chain', fs)

      // Moving particles along flows for clarity
      drawParticle(ctx, w * 0.5, h * 0.32, w * 0.3, h * 0.55, t * 0.35, '#58d68d')
      drawParticle(ctx, w * 0.7, h * 0.55, w * 0.55, h * 0.32, t * 0.4 + 0.3, '#e74c3c')
      drawParticle(ctx, w * 0.35, h * 0.72, w * 0.65, h * 0.72, t * 0.3 + 0.15, '#f39c12')

      drawValueChip(ctx, 'CO₂', st.co2.toFixed(0), w * 0.5 - 50, h * 0.2 - Math.min(w, h) * 0.14, {
        fontSize: Math.max(10, fs - 2),
        accent: true,
      })
      drawValueChip(ctx, 'O₂', st.o2.toFixed(0), w * 0.5 + 50, h * 0.2 - Math.min(w, h) * 0.14, {
        fontSize: Math.max(10, fs - 2),
      })

      const vg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.4,
        Math.min(w, h) * 0.15,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      )
      vg.addColorStop(0, 'rgba(255,255,255,0.04)')
      vg.addColorStop(1, 'rgba(0,0,0,0.18)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      drawBadge(ctx, running ? 'Running' : 'Paused', 12, 18, {
        font: `${fontPx(12, w, h)}px Roboto, sans-serif`,
        bg: running ? 'rgba(39,174,96,0.85)' : 'rgba(0,0,0,0.45)',
      })
      drawLegend(
        ctx,
        [
          { color: '#3d8fd1', label: 'Air' },
          { color: '#2a9d5c', label: 'Plants' },
          { color: '#e67e22', label: 'Animals' },
        ],
        12,
        h - 16,
        fontPx(11, w, h, 10, 14),
      )
      drawHint(ctx, 'adjust photosynthesis vs respiration rates', w / 2, h - 36, w, h, { muted: true })
    },
    [photo, resp, running],
  )

  useCanvasLoop(canvasRef, draw, running, tick, true)

  return (
    <SimShell
      title="Carbon–Oxygen Cycle"
      subtitle="Photosynthesis and respiration balance gases in ecosystems"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createCarbonOxygenState()
        setPhoto(0.55)
        setResp(0.4)
        setTick((n) => n + 1)
      }}
      controls={
        <>
          <ControlSection title="Rates">
            <ControlHint>Adjust how quickly plants and animals exchange gases.</ControlHint>
            <ControlSlider
              label="Photosynthesis"
              value={photo}
              min={0.1}
              max={1}
              step={0.05}
              display={photo.toFixed(2)}
              onChange={setPhoto}
            />
            <ControlSlider
              label="Respiration"
              value={resp}
              min={0.1}
              max={1}
              step={0.05}
              display={resp.toFixed(2)}
              onChange={setResp}
            />
          </ControlSection>
          <ControlSection title="Atmosphere">
            <ControlStats>
              <ControlStat label="CO₂" value={readout.co2.toFixed(0)} />
              <ControlStat label="O₂" value={readout.o2.toFixed(0)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}

function drawPool(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  title: string,
  sub: string,
  fs: number,
) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  fillFittedText(ctx, title, x, y - fs * 0.45, r * 1.7, fs, {
    minPx: 9,
    align: 'center',
    baseline: 'middle',
  })
  ctx.font = `${Math.max(10, fs - 2)}px Roboto, sans-serif`
  fillFittedText(ctx, sub, x, y + fs * 0.7, r * 1.7, Math.max(10, fs - 2), {
    minPx: 8,
    align: 'center',
    baseline: 'middle',
  })
}

function drawFlow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  t: number,
  label: string,
  fs: number,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2.5, fs / 5)
  ctx.setLineDash([10, 8])
  ctx.lineDashOffset = -t * 45
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const short = label.split('\n')[0]
  drawLabelPill(ctx, short, mx, my, { fontSize: Math.max(10, fs - 1) })
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  phase: number,
  color: string,
) {
  const u = ((phase % 1) + 1) % 1
  const x = x1 + (x2 - x1) * u
  const y = y1 + (y2 - y1) * u
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
