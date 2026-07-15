import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { drawLegend, fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  createPredatorPreyState,
  stepPredatorPrey,
  type PredatorPreyState,
} from './predatorPreyModel'

type Layout = {
  fieldH: number
  growth: { x: number; y: number; r: number; trackX: number; trackW: number; min: number; max: number }
}

export function PredatorPreySim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<PredatorPreyState>(createPredatorPreyState())
  const paramsRef = useRef({ growth: 1.1 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<PredatorPreyState['mode']>('predation')
  const [growth, setGrowth] = useState(1.1)
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ prey: 40, predators: 12 })

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      setReadout({ prey: s.prey, predators: s.predators })
      setGrowth(Math.round(paramsRef.current.growth * 100) / 100)
    }, 180)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.growth.x, pt.y - L.growth.y) < L.growth.r + 14) return 'growth'
      if (pt.y < L.fieldH) return 'field'
      return null
    },
    cursorForHit: (id) => (id === 'field' ? 'pointer' : 'grab'),
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      const L = layoutRef.current
      if (!L || id !== 'growth') return
      hintShown.current = false
      const t = clamp((pt.x - L.growth.trackX) / Math.max(1, L.growth.trackW), 0, 1)
      paramsRef.current.growth = L.growth.min + t * (L.growth.max - L.growth.min)
    },
    onTap: (id, pt) => {
      if (id !== 'field') return
      const L = layoutRef.current
      if (!L) return
      hintShown.current = false
      const s = stateRef.current
      if (pt.x < (canvasRef.current?.parentElement?.clientWidth ?? 400) * 0.5) {
        s.prey = Math.min(120, s.prey + 8)
      } else {
        s.predators = Math.min(80, s.predators + 4)
      }
      setVersion((v) => v + 1)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const s = stateRef.current
      s.mode = mode
      s.growth = paramsRef.current.growth
      if (dt > 0 && running) stateRef.current = stepPredatorPrey(s, dt)
      const st = stateRef.current
      const fs = fontPx(12, w, h)
      const hover = hoverRef.current

      ctx.fillStyle = '#10283a'
      ctx.fillRect(0, 0, w, h)

      const fieldH = h * 0.58
      ctx.fillStyle = 'rgba(30,132,73,0.28)'
      ctx.fillRect(0, 0, w, fieldH)

      const preyN = Math.min(90, Math.round(st.prey))
      const predN = Math.min(45, Math.round(st.predators))
      for (let i = 0; i < preyN; i++) {
        const x = ((i * 47 + st.time * 22) % Math.max(20, w - 20)) + 10
        const y = ((i * 31) % Math.max(20, fieldH - 28)) + 14
        ctx.beginPath()
        ctx.arc(x, y, Math.max(3, fs / 4), 0, Math.PI * 2)
        ctx.fillStyle = '#2ecc71'
        ctx.fill()
      }
      for (let i = 0; i < predN; i++) {
        const x = ((i * 53 + st.time * 14) % Math.max(20, w - 20)) + 10
        const y = ((i * 41 + 20) % Math.max(20, fieldH - 28)) + 14
        ctx.beginPath()
        ctx.arc(x, y, Math.max(4.5, fs / 3), 0, Math.PI * 2)
        ctx.fillStyle = '#e74c3c'
        ctx.fill()
      }

      const chartY = fieldH + 8
      const chartH = h - chartY - 28
      ctx.fillStyle = 'rgba(11,28,44,0.92)'
      roundRectFill(ctx, 10, chartY, w - 20, chartH, 8)
      const hist = st.history
      if (hist.length > 1) {
        const plot = (key: 'prey' | 'predators', color: string) => {
          ctx.beginPath()
          ctx.strokeStyle = color
          ctx.lineWidth = 2.2
          hist.forEach((p, i) => {
            const x = 10 + (i / Math.max(1, hist.length - 1)) * (w - 20)
            const y = chartY + chartH - (p[key] / 120) * (chartH - 10)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
        }
        plot('prey', '#2ecc71')
        plot('predators', '#e74c3c')
      }

      // Growth scrub handle along bottom of chart
      const gMin = 0.4
      const gMax = 1.8
      const trackX = 24
      const trackW = w - 48
      const g = paramsRef.current.growth
      const handleX = trackX + ((g - gMin) / (gMax - gMin)) * trackW
      const handleY = chartY + chartH - 16
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(trackX, handleY)
      ctx.lineTo(trackX + trackW, handleY)
      ctx.stroke()
      drawHoverHalo(ctx, handleX, handleY, 16, hover === 'growth')
      ctx.fillStyle = hover === 'growth' ? '#f1c40f' : '#f39c12'
      ctx.beginPath()
      ctx.arc(handleX, handleY, 9, 0, Math.PI * 2)
      ctx.fill()
      drawValueChip(ctx, 'growth', g.toFixed(2), handleX, handleY - 18, {
        align: 'center',
        fontSize: Math.max(10, fs - 2),
      })

      layoutRef.current = {
        fieldH,
        growth: { x: handleX, y: handleY, r: 9, trackX, trackW, min: gMin, max: gMax },
      }

      drawLegend(
        ctx,
        [
          { color: '#2ecc71', label: `Prey ${st.prey.toFixed(0)}` },
          { color: '#e74c3c', label: `Predators ${st.predators.toFixed(0)}` },
        ],
        14,
        18,
        fs,
      )
      drawLabelPill(ctx, `Mode: ${mode}`, w - 16, 22, {
        align: 'right',
        fontSize: fs,
        bg: 'rgba(0,0,0,0.45)',
        fg: '#fff',
      })
      drawValueChip(ctx, 'field', 'tap left prey · right predators', 14, fieldH - 14, {
        align: 'left',
        fontSize: Math.max(10, fs - 2),
      })
      drawLabelPill(ctx, 'population over time', w / 2, chartY + 14, {
        fontSize: Math.max(10, fs - 2),
        bold: false,
      })
      if (hintShown.current) {
        drawHint(ctx, 'Drag growth · tap field to seed', w / 2, fieldH * 0.5, w, h)
      }
    },
    [mode, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Predator–Prey Dynamics"
      subtitle="Compare predation, competition, and mutualism"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPredatorPreyState()
        paramsRef.current.growth = 1.1
        setMode('predation')
        setGrowth(1.1)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Interaction">
            <ControlHint>
              Drag the growth handle on the chart, or tap the field (left = prey, right = predators).
            </ControlHint>
            <ControlSelect
              label="Mode"
              value={mode}
              options={[
                { value: 'predation', label: 'Predation' },
                { value: 'competition', label: 'Competition' },
                { value: 'mutualism', label: 'Mutualism' },
              ]}
              onChange={(v) => setMode(v as PredatorPreyState['mode'])}
            />
            <ControlSlider
              label="Prey growth"
              value={growth}
              min={0.4}
              max={1.8}
              step={0.05}
              display={growth.toFixed(2)}
              onChange={(v) => {
                paramsRef.current.growth = v
                setGrowth(v)
              }}
            />
          </ControlSection>
          <ControlSection title="Population">
            <ControlStats>
              <ControlStat label="Prey" value={readout.prey.toFixed(1)} />
              <ControlStat label="Predators" value={readout.predators.toFixed(1)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}

function roundRectFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}
