import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect, withShadow } from '../../shared/drawHelpers'
import { drawFaintGrid } from '../../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import { calcPressure, createPressureState, stepPressure } from './pressureForceAreaModel'

type Layout = {
  forceHandle: { x: number; y: number }
  areaLeft: number
  areaRight: number
  areaY: number
}

export function PressureForceAreaSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createPressureState())
  const paramsRef = useRef({ force: 100, area: 10 })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(false)
  const [force, setForce] = useState(100)
  const [area, setArea] = useState(10)
  const [version, setVersion] = useState(0)
  const [pressure, setPressure] = useState(calcPressure(100, 10))

  paramsRef.current.force = force
  paramsRef.current.area = area

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = paramsRef.current
      setForce(Math.round(p.force))
      setArea(Math.round(p.area))
      setPressure(calcPressure(p.force, p.area))
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.forceHandle.x, pt.y - L.forceHandle.y) < 24) return 'force'
      if (Math.abs(pt.y - L.areaY) < 18 && pt.x >= L.areaLeft - 10 && pt.x <= L.areaRight + 10)
        return 'area'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt, size) => {
      hintShown.current = false
      const p = paramsRef.current
      if (id === 'force') {
        p.force = clamp(20 + ((size.h * 0.35 - pt.y) / (size.h * 0.25)) * 180, 20, 200)
      } else if (id === 'area') {
        const L = layoutRef.current
        if (!L) return
        const mid = (L.areaLeft + L.areaRight) / 2
        const half = Math.abs(pt.x - mid)
        p.area = clamp(half / 2.25, 1, 50)
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) stateRef.current = stepPressure(stateRef.current, dt, running)
      const st = stateRef.current
      const { force: F, area: A } = paramsRef.current
      const P = calcPressure(F, A)
      const fs = fontPx(13, w, h)
      const depth = st.pressDepth
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'force')
      drawFaintGrid(ctx, w, h)

      const surfaceY = h * 0.62
      const blockW = Math.min(w * 0.35, 200)
      const blockH = 36
      const blockX = (w - blockW) / 2
      const blockY = h * 0.22 - depth * 28

      drawHoverHalo(ctx, blockX + blockW / 2, blockY + blockH / 2, 40, hover === 'force')
      withShadow(ctx, () => {
        ctx.fillStyle = '#85929e'
        roundRect(ctx, blockX, blockY, blockW, blockH, 6)
        ctx.fill()
      })
      ctx.strokeStyle = hover === 'force' ? '#2980b9' : '#2c3e50'
      ctx.lineWidth = hover === 'force' ? 3 : 2
      roundRect(ctx, blockX, blockY, blockW, blockH, 6)
      ctx.stroke()
      drawValueChip(ctx, 'F', `${F.toFixed(0)} N`, blockX + blockW / 2, blockY - 16, { fontSize: fs })

      const contactW = Math.max(20, Math.min(blockW * 0.85, A * 4.5))
      const contactX = blockX + (blockW - contactW) / 2
      const intensity = Math.min(1, P / 40)
      drawHoverHalo(ctx, contactX + contactW / 2, surfaceY, contactW * 0.55, hover === 'area')
      ctx.fillStyle = `rgba(231, 76, 60, ${0.25 + intensity * 0.65})`
      ctx.fillRect(contactX, surfaceY - 4, contactW, 8)
      // Area drag grips
      ctx.fillStyle = hover === 'area' ? '#2980b9' : '#c0392b'
      ctx.beginPath()
      ctx.arc(contactX, surfaceY, 7, 0, Math.PI * 2)
      ctx.arc(contactX + contactW, surfaceY, 7, 0, Math.PI * 2)
      ctx.fill()
      drawValueChip(ctx, 'A', `${A.toFixed(0)} cm²`, contactX + contactW / 2, surfaceY + 22, {
        fontSize: Math.max(10, fs - 1),
      })
      drawValueChip(ctx, 'P', `${P.toFixed(1)} N/cm²`, w / 2, surfaceY + 48, {
        fontSize: fs + 1,
        accent: true,
      })

      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(w * 0.08, surfaceY)
      ctx.lineTo(w * 0.92, surfaceY)
      ctx.stroke()
      drawLabelPill(ctx, 'surface', w * 0.12, surfaceY + 18, { fontSize: Math.max(9, fs - 2) })

      layoutRef.current = {
        forceHandle: { x: blockX + blockW / 2, y: blockY + blockH / 2 },
        areaLeft: contactX,
        areaRight: contactX + contactW,
        areaY: surfaceY,
      }

      const nailMode = A < 8
      drawLabelPill(
        ctx,
        nailMode ? 'Sharp tip — small A → high P' : 'Wide shoe — large A → low P',
        w / 2,
        h * 0.1,
        { fontSize: fs },
      )
      if (hintShown.current) drawHint(ctx, 'drag block for force · drag contact width for area', w / 2, h - 14, w, h)
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Pressure = Force ÷ Area"
      subtitle="Spread force over area to see pressure change"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createPressureState()
        paramsRef.current = { force: 100, area: 10 }
        setForce(100)
        setArea(10)
        setRunning(false)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Variables">
            <ControlHint>Drag the force block or contact-area grips on the canvas.</ControlHint>
            <ControlSlider
              label="Force (F)"
              value={force}
              min={20}
              max={200}
              step={5}
              display={`${force} N`}
              onChange={(v) => {
                setForce(v)
                paramsRef.current.force = v
              }}
            />
            <ControlSlider
              label="Contact area (A)"
              value={area}
              min={1}
              max={50}
              step={1}
              display={`${area} cm²`}
              onChange={(v) => {
                setArea(v)
                paramsRef.current.area = v
              }}
            />
          </ControlSection>
          <ControlSection title="Result">
            <ControlStats>
              <ControlStat label="Pressure" value={`${pressure.toFixed(1)} N/cm²`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
