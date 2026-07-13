import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import { phToColor } from './PhScaleSim'

export interface NeutralizationState {
  acidVol: number
  baseVol: number
  mixedAcid: number
  mixedBase: number
  ph: number
  pourProgress: number
  time: number
}

export function createNeutralizationState(): NeutralizationState {
  return {
    acidVol: 50,
    baseVol: 50,
    mixedAcid: 0,
    mixedBase: 0,
    ph: 2,
    pourProgress: 0,
    time: 0,
  }
}

/** Strong acid + strong base → salt + water; pH from excess reagent. */
export function stepNeutralization(
  s: NeutralizationState,
  dt: number,
  acidTarget: number,
  baseTarget: number,
): NeutralizationState {
  const pourSpeed = 0.35
  let { mixedAcid, mixedBase, pourProgress } = s
  pourProgress = Math.min(1, pourProgress + dt * pourSpeed)

  mixedAcid = acidTarget * pourProgress
  mixedBase = baseTarget * pourProgress

  const neutralized = Math.min(mixedAcid, mixedBase)
  const excessAcid = mixedAcid - neutralized
  const excessBase = mixedBase - neutralized

  let ph = 7
  if (excessAcid > 0.5) ph = 7 - Math.min(6, excessAcid / Math.max(1, acidTarget) * 6)
  else if (excessBase > 0.5) ph = 7 + Math.min(6, excessBase / Math.max(1, baseTarget) * 6)

  return {
    ...s,
    acidVol: acidTarget,
    baseVol: baseTarget,
    mixedAcid,
    mixedBase,
    ph,
    pourProgress,
    time: s.time + dt,
  }
}

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
) {
  const neck = width * 0.35
  ctx.strokeStyle = '#5d6d7e'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx - neck, top)
  ctx.lineTo(cx - neck, top + (bottom - top) * 0.22)
  ctx.lineTo(cx - width, bottom)
  ctx.lineTo(cx + width, bottom)
  ctx.lineTo(cx + neck, top + (bottom - top) * 0.22)
  ctx.lineTo(cx + neck, top)
  ctx.stroke()

  const liquidTop = bottom - (bottom - top) * 0.15 - fillLevel * (bottom - top) * 0.55
  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.moveTo(cx - width + 4, bottom - 4)
  ctx.lineTo(cx - width + 4, liquidTop)
  ctx.lineTo(cx + width - 4, liquidTop)
  ctx.lineTo(cx + width - 4, bottom - 4)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(label, cx, bottom + fs + 6)
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

      ctx.fillStyle = '#f7f9fb'
      ctx.fillRect(0, 0, w, h)

      const top = h * 0.12
      const bottom = h * 0.52
      const vesselTop = h * 0.38
      const vesselBottom = h * 0.78
      const bw = Math.min(w * 0.1, 52)

      drawHoverHalo(ctx, w * 0.22, (top + bottom) / 2, 40, hover === 'acid')
      drawHoverHalo(ctx, w * 0.78, (top + bottom) / 2, 40, hover === 'base')
      drawBeaker(ctx, w * 0.22, top, bottom, bw, aV / 100, '#fdebd0', 'Acid (H⁺)', fs)
      drawBeaker(ctx, w * 0.78, top, bottom, bw, bV / 100, '#d6eaf8', 'Base (OH⁻)', fs)
      drawValueChip(ctx, '', `${aV.toFixed(0)} mL`, w * 0.22, top - 8, { fontSize: fs })
      drawValueChip(ctx, '', `${bV.toFixed(0)} mL`, w * 0.78, top - 8, { fontSize: fs })
      layoutRef.current = {
        acid: { x: w * 0.22, y: (top + bottom) / 2, r: 42 },
        base: { x: w * 0.78, y: (top + bottom) / 2, r: 42 },
      }

      const vesselX = w * 0.5
      const vw = Math.min(w * 0.22, 110)
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(vesselX - vw * 0.4, vesselTop)
      ctx.lineTo(vesselX - vw, vesselBottom)
      ctx.lineTo(vesselX + vw, vesselBottom)
      ctx.lineTo(vesselX + vw * 0.4, vesselTop)
      ctx.closePath()
      ctx.stroke()

      const mixLevel = st.pourProgress * 0.65 + (st.pourProgress > 0 ? 0.08 : 0)
      const liquidTop =
        vesselBottom - 8 - mixLevel * (vesselBottom - vesselTop - 16)
      ctx.fillStyle = phToColor(st.ph)
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.moveTo(vesselX - vw + 6, vesselBottom - 6)
      ctx.lineTo(vesselX - vw + 6, liquidTop)
      ctx.lineTo(vesselX + vw - 6, liquidTop)
      ctx.lineTo(vesselX + vw - 6, vesselBottom - 6)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1

      if (running && st.pourProgress < 1) {
        const drip = (st.time * 3) % 1
        for (const sx of [w * 0.22, w * 0.78]) {
          ctx.strokeStyle = sx < w * 0.5 ? '#e67e22' : '#3498db'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(sx, bottom)
          ctx.lineTo(vesselX + (sx < w * 0.5 ? -20 : 20), vesselTop + drip * 40)
          ctx.stroke()
        }
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Reaction vessel', vesselX, vesselBottom + fs + 8)
      if (st.pourProgress > 0.95) {
        ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
        ctx.fillStyle = '#27ae60'
        ctx.fillText('Salt + water formed', vesselX, vesselBottom + fs * 2 + 4)
      }

      const meterX = w * 0.86
      const meterTop = h * 0.2
      const meterH = h * 0.45
      const meterW = 22
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
      ctx.moveTo(meterX - 12, needleY)
      ctx.lineTo(meterX + meterW + 12, needleY)
      ctx.stroke()

      drawValueChip(ctx, 'pH', st.ph.toFixed(1), meterX + meterW + 36, needleY, {
        fontSize: fs,
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
