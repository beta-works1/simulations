import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import {
  clearThemedScene,
  drawErlenmeyerFlask,
  fillClippedLiquid,
  fontPx,
  roundRect,
  taperedVesselPath,
  withShadow,
} from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import { phToColor } from './phScaleModel'
import { createNeutralizationState, stepNeutralization } from './neutralizationModel'

function drawBeaker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bottom: number,
  width: number,
  fillLevel: number,
  fillColor: string,
  label: string,
  fs: number,
  highlighted = false,
) {
  withShadow(ctx, () => {
    drawErlenmeyerFlask(ctx, cx, top, bottom, width, fillLevel * 0.75 + 0.08, fillColor, {
      stroke: highlighted ? '#2980b9' : '#5d6d7e',
      lineWidth: highlighted ? 3 : 2.5,
      neckRatio: 0.35,
      shoulderT: 0.2,
      alpha: 0.9,
    })
  })

  drawLabelPill(ctx, label, cx, bottom + fs + 8, {
    fontSize: Math.max(10, fs - 1),
    bold: false,
  })
}

export function NeutralizationSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createNeutralizationState())
  const paramsRef = useRef({ acidVol: 50, baseVol: 50 })
  const layoutRef = useRef<{ acid: { x: number; y: number; r: number }; base: { x: number; y: number; r: number } } | null>(
    null,
  )
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(false)
  const [acidVol, setAcidVol] = useState(50)
  const [baseVol, setBaseVol] = useState(50)
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ ph: 2, excess: '—' })

  paramsRef.current.acidVol = acidVol
  paramsRef.current.baseVol = baseVol

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      const neutralized = Math.min(s.mixedAcid, s.mixedBase)
      const excessAcid = s.mixedAcid - neutralized
      const excessBase = s.mixedBase - neutralized
      let excess = 'Balanced'
      if (s.pourProgress < 0.99) excess = 'Mixing…'
      else if (excessAcid > 0.5) excess = `Excess acid (${excessAcid.toFixed(0)} mL)`
      else if (excessBase > 0.5) excess = `Excess base (${excessBase.toFixed(0)} mL)`
      setReadout({ ph: s.ph, excess })
      setAcidVol(Math.round(paramsRef.current.acidVol))
      setBaseVol(Math.round(paramsRef.current.baseVol))
    }, 150)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (Math.hypot(pt.x - L.acid.x, pt.y - L.acid.y) < L.acid.r) return 'acid'
      if (Math.hypot(pt.x - L.base.x, pt.y - L.base.y) < L.base.r) return 'base'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onDrag: (id, pt, size) => {
      hintShown.current = false
      const t = clamp(1 - (pt.y - size.h * 0.12) / (size.h * 0.4), 0, 1)
      const vol = 10 + t * 90
      if (id === 'acid') paramsRef.current.acidVol = vol
      if (id === 'base') paramsRef.current.baseVol = vol
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const { acidVol: aV, baseVol: bV } = paramsRef.current
      const s = stateRef.current
      if (dt > 0 && running) {
        stateRef.current = stepNeutralization(s, dt, aV, bV)
      } else {
        s.acidVol = aV
        s.baseVol = bV
      }
      const st = stateRef.current
      const fs = fontPx(12, w, h)
      const hover = hoverRef.current

      clearThemedScene(ctx, w, h, 'chemistry')

      // Keep acid / vessel / base / pH strip from overlapping
      const top = h * 0.14
      const bottom = h * 0.48
      const vesselTop = h * 0.42
      const vesselBottom = h * 0.76
      const bw = Math.min(w * 0.09, 48)
      const acidX = w * 0.2
      const baseX = w * 0.68

      drawHoverHalo(ctx, acidX, (top + bottom) / 2, bw * 0.9, hover === 'acid')
      drawHoverHalo(ctx, baseX, (top + bottom) / 2, bw * 0.9, hover === 'base')
      drawBeaker(ctx, acidX, top, bottom, bw, aV / 100, '#f5b041', 'Acid (H⁺)', fs, hover === 'acid')
      drawBeaker(ctx, baseX, top, bottom, bw, bV / 100, '#5dade2', 'Base (OH⁻)', fs, hover === 'base')
      drawValueChip(ctx, '', `${aV.toFixed(0)} mL`, acidX, top - 12, { fontSize: fs })
      drawValueChip(ctx, '', `${bV.toFixed(0)} mL`, baseX, top - 12, { fontSize: fs })
      layoutRef.current = {
        acid: { x: acidX, y: (top + bottom) / 2, r: bw + 10 },
        base: { x: baseX, y: (top + bottom) / 2, r: bw + 10 },
      }

      const vesselX = w * 0.44
      const vw = Math.min(w * 0.16, 90)
      const halfTop = vw * 0.42
      const mixLevel = st.pourProgress * 0.65 + (st.pourProgress > 0 ? 0.08 : 0)
      withShadow(ctx, () => {
        const path = (c: CanvasRenderingContext2D) =>
          taperedVesselPath(c, vesselX, vesselTop, vesselBottom, halfTop, vw)
        fillClippedLiquid(ctx, path, vesselTop, vesselBottom, mixLevel, phToColor(st.ph), {
          inset: 3,
          alpha: 0.88,
        })
        path(ctx)
        ctx.strokeStyle = '#2c3e50'
        ctx.lineWidth = 3
        ctx.stroke()
      })

      if (running && st.pourProgress < 1) {
        const drip = (st.time * 3) % 1
        for (const sx of [acidX, baseX]) {
          ctx.strokeStyle = sx < vesselX ? '#e67e22' : '#3498db'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(sx, bottom)
          ctx.lineTo(vesselX + (sx < vesselX ? -18 : 18), vesselTop + drip * 36)
          ctx.stroke()
        }
      }

      drawLabelPill(ctx, 'Reaction vessel', vesselX, vesselBottom + 14, {
        fontSize: Math.max(10, fs - 1),
        bold: false,
      })
      if (st.pourProgress > 0.95) {
        drawLabelPill(ctx, 'Salt + water formed', vesselX, vesselBottom + 34, {
          fontSize: Math.max(10, fs - 1),
          bg: 'rgba(39,174,96,0.18)',
        })
      }

      // pH strip on the far right, clear of base beaker
      const meterX = w * 0.9
      const meterTop = h * 0.18
      const meterH = h * 0.5
      const meterW = 18
      const grad = ctx.createLinearGradient(0, meterTop + meterH, 0, meterTop)
      for (let i = 0; i <= 14; i++) grad.addColorStop(i / 14, phToColor(i))
      roundRect(ctx, meterX, meterTop, meterW, meterH, 6)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 1.5
      roundRect(ctx, meterX, meterTop, meterW, meterH, 6)
      ctx.stroke()

      const needleY = meterTop + meterH - (st.ph / 14) * meterH
      ctx.strokeStyle = '#1a252f'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(meterX - 10, needleY)
      ctx.lineTo(meterX + meterW + 10, needleY)
      ctx.stroke()

      drawValueChip(ctx, 'pH', st.ph.toFixed(1), meterX - 28, needleY, {
        fontSize: Math.max(10, fs - 1),
        accent: true,
      })
      if (hintShown.current) drawHint(ctx, 'drag beakers to set volumes', w / 2, h - 12, w, h)
    },
    [running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Acid–Base Neutralization"
      subtitle="Mix acid and base to form salt and water"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createNeutralizationState()
        paramsRef.current = { acidVol: 50, baseVol: 50 }
        setAcidVol(50)
        setBaseVol(50)
        setRunning(false)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Volumes">
            <ControlHint>Drag acid/base beakers on the canvas, or use sliders.</ControlHint>
            <ControlSlider
              label="Acid volume"
              value={acidVol}
              min={10}
              max={100}
              step={5}
              display={`${acidVol} mL`}
              onChange={(v) => {
                setAcidVol(v)
                paramsRef.current.acidVol = v
              }}
            />
            <ControlSlider
              label="Base volume"
              value={baseVol}
              min={10}
              max={100}
              step={5}
              display={`${baseVol} mL`}
              onChange={(v) => {
                setBaseVol(v)
                paramsRef.current.baseVol = v
              }}
            />
          </ControlSection>
          <ControlSection title="Result">
            <ControlStats>
              <ControlStat label="pH" value={readout.ph.toFixed(1)} />
              <ControlStat label="Leftover" value={readout.excess} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
