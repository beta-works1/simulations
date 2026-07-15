import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import { createGreenhouseState, stepGreenhouse } from './globalWarmingModel'

type Layout = {
  layer: { x: number; y: number; w: number; h: number; baseThick: number; maxExtra: number }
  handle: { x: number; y: number; r: number }
}

export function GlobalWarmingSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createGreenhouseState())
  const paramsRef = useRef({ co2: 0.4 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [co2, setCo2] = useState(0.4)
  const [version, setVersion] = useState(0)
  const [temp, setTemp] = useState(15)

  useEffect(() => {
    const id = window.setInterval(() => {
      setTemp(stateRef.current.temperature)
      setCo2(Math.round(paramsRef.current.co2 * 100) / 100)
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.handle.x, pt.y - L.handle.y) < L.handle.r + 12) return 'layer'
      const g = L.layer
      if (pt.x >= g.x && pt.x <= g.x + g.w + 20 && pt.y >= g.y && pt.y <= g.y + g.h) return 'layer'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt) => {
      const L = layoutRef.current
      if (!L || id !== 'layer') return
      hintShown.current = false
      const extra = pt.x - L.layer.x - L.layer.baseThick
      const t = clamp(extra / L.layer.maxExtra, 0.05, 1)
      paramsRef.current.co2 = t
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const co2Val = paramsRef.current.co2
      stateRef.current.co2Level = co2Val
      if (dt > 0 && running) stateRef.current = stepGreenhouse(stateRef.current, dt)
      const s = stateRef.current
      const fs = fontPx(13, w, h)
      const heat = Math.min(1, (s.temperature - 10) / 30)
      const hover = hoverRef.current

      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, `rgb(${40 + heat * 90}, ${90 - heat * 45}, ${150 - heat * 70})`)
      sky.addColorStop(1, `rgb(${170 + heat * 70}, ${130 - heat * 35}, ${55})`)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const sunX = w * 0.16
      const sunY = h * 0.2
      ctx.save()
      ctx.shadowColor = '#f1c40f'
      ctx.shadowBlur = 24
      ctx.fillStyle = '#f4d03f'
      ctx.beginPath()
      ctx.arc(sunX, sunY, Math.min(w, h) * 0.055, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      for (let i = 0; i < 7; i++) {
        const y = h * 0.12 + i * ((h * 0.7) / 7)
        ctx.strokeStyle = 'rgba(241,196,15,0.5)'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(sunX + 28, sunY)
        ctx.lineTo(w * 0.52, y)
        ctx.stroke()
      }

      const baseThick = 16
      const maxExtra = Math.min(w * 0.12, 70)
      const thick = baseThick + co2Val * maxExtra
      const layerX = w * 0.5
      const layerY = h * 0.08
      const layerH = h * 0.78
      ctx.fillStyle = `rgba(176, 190, 197, ${0.22 + co2Val * 0.45})`
      ctx.fillRect(layerX, layerY, thick, layerH)
      if (hover === 'layer') {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 2
        ctx.strokeRect(layerX, layerY, thick, layerH)
      }

      const handleX = layerX + thick
      const handleY = layerY + layerH * 0.35
      drawHoverHalo(ctx, handleX, handleY, 18, hover === 'layer')
      ctx.beginPath()
      ctx.arc(handleX, handleY, 10, 0, Math.PI * 2)
      ctx.fillStyle = hover === 'layer' ? '#ecf0f1' : '#b0bec5'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      layoutRef.current = {
        layer: { x: layerX, y: layerY, w: thick, h: layerH, baseThick, maxExtra },
        handle: { x: handleX, y: handleY, r: 12 },
      }

      const bounce = Math.floor(2 + co2Val * 7)
      for (let i = 0; i < bounce; i++) {
        const t = (s.time * 0.45 + i * 0.28) % 1
        const x = w * 0.52 + Math.sin(t * Math.PI) * (thick + 18)
        const y = h * 0.15 + ((i * 41 + s.time * 50) % (h * 0.65))
        ctx.strokeStyle = `rgba(231, 76, 60, ${0.45 + 0.4 * Math.sin(s.time + i)})`
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(w * 0.78, y)
        ctx.lineTo(x, y - 8)
        ctx.stroke()
      }

      ctx.fillStyle = '#fff'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      drawValueChip(ctx, 'Surface', `${s.temperature.toFixed(1)} °C`, 20, h - 40, {
        align: 'left',
        accent: true,
        fontSize: fs,
      })
      drawLabelPill(ctx, 'Sun', sunX, sunY + Math.min(w, h) * 0.08, { fontSize: Math.max(10, fs - 2) })
      drawLabelPill(ctx, 'greenhouse gases', layerX + thick / 2 + 8, h * 0.2, {
        align: 'left',
        fontSize: Math.max(10, fs - 2),
        bg: 'rgba(0,0,0,0.4)',
        fg: '#fff',
      })
      drawLabelPill(ctx, 'drag layer to thicken', handleX, handleY - 22, {
        fontSize: Math.max(9, fs - 3),
        bold: false,
      })
      drawLabelPill(ctx, 'Yellow = sunlight · Red = trapped IR', w / 2, h - 14, {
        fontSize: Math.max(10, fs - 2),
        bold: false,
      })

      if (hintShown.current) {
        drawHint(ctx, 'drag the greenhouse layer edge to change CO₂', w / 2, h - 36, w, h, {
          muted: true,
        })
      }
    },
    [co2, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Global Warming Mechanism"
      subtitle="Greenhouse gases trap infrared heat near Earth"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createGreenhouseState()
        paramsRef.current.co2 = 0.4
        setCo2(0.4)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Atmosphere">
            <ControlHint>Increase gases and watch more heat bounce back to the surface.</ControlHint>
            <ControlSlider
              label="Greenhouse gases"
              value={co2}
              min={0.05}
              max={1}
              step={0.05}
              display={`${Math.round(co2 * 100)}%`}
              onChange={(v) => {
                hintShown.current = false
                paramsRef.current.co2 = v
                setCo2(v)
              }}
            />
          </ControlSection>
          <ControlSection title="Result">
            <ControlStats>
              <ControlStat label="Temperature" value={`${temp.toFixed(1)} °C`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
