import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
  ControlStack,
} from '../../shared/Controls'
import {
  clearThemedScene,
  drawErlenmeyerFlask,
  fillClippedLiquid,
  fontPx,
  roundRect,
  withShadow,
} from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  createIndicatorState,
  expectedColor,
  indicatorColor,
  phCategory,
  stepIndicator,
  type IndicatorType,
  type SubstanceType,
} from './naturalIndicatorModel'

type Hit =
  | 'ind-cabbage'
  | 'ind-turmeric'
  | 'sub-acid'
  | 'sub-neutral'
  | 'sub-base'
  | 'drip'
  | 'beaker'
  | null

type Box = { x: number; y: number; w: number; h: number }

type Layout = {
  cabbage: Box
  turmeric: Box
  acid: Box
  neutral: Box
  base: Box
  drip: Box
  beaker: Box
}

function inBox(pt: { x: number; y: number }, b: Box) {
  return pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h
}

export function NaturalIndicatorSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createIndicatorState())
  const paramsRef = useRef({
    indicator: 'cabbage' as IndicatorType,
    substance: 'neutral' as SubstanceType,
    dripping: false,
  })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<Hit>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(false)
  const [indicator, setIndicator] = useState<IndicatorType>('cabbage')
  const [substance, setSubstance] = useState<SubstanceType>('neutral')
  const [version, setVersion] = useState(0)
  const [readout, setReadout] = useState({ ph: 7, category: 'Neutral' })

  paramsRef.current.indicator = indicator
  paramsRef.current.substance = substance

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current
      setReadout({ ph: s.displayPh, category: phCategory(s.displayPh) })
      setRunning(paramsRef.current.dripping && s.dripProgress < 1)
    }, 150)
    return () => clearInterval(id)
  }, [])

  const resetMix = () => {
    stateRef.current = createIndicatorState()
    paramsRef.current.dripping = false
    setRunning(false)
  }

  const startDrip = () => {
    hintShown.current = false
    stateRef.current = createIndicatorState()
    paramsRef.current.dripping = true
    setRunning(true)
    setVersion((v) => v + 1)
  }

  useCanvasPointer(canvasRef, {
    cursorForHit: () => 'pointer',
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      if (inBox(pt, L.cabbage)) return 'ind-cabbage'
      if (inBox(pt, L.turmeric)) return 'ind-turmeric'
      if (inBox(pt, L.acid)) return 'sub-acid'
      if (inBox(pt, L.neutral)) return 'sub-neutral'
      if (inBox(pt, L.base)) return 'sub-base'
      if (inBox(pt, L.drip)) return 'drip'
      if (inBox(pt, L.beaker)) return 'beaker'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id as Hit
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      const p = paramsRef.current
      if (id === 'ind-cabbage') {
        p.indicator = 'cabbage'
        setIndicator('cabbage')
        resetMix()
      } else if (id === 'ind-turmeric') {
        p.indicator = 'turmeric'
        setIndicator('turmeric')
        resetMix()
      } else if (id === 'sub-acid') {
        p.substance = 'acid'
        setSubstance('acid')
        resetMix()
      } else if (id === 'sub-neutral') {
        p.substance = 'neutral'
        setSubstance('neutral')
        resetMix()
      } else if (id === 'sub-base') {
        p.substance = 'base'
        setSubstance('base')
        resetMix()
      } else if (id === 'drip' || id === 'beaker') {
        startDrip()
      }
      setVersion((v) => v + 1)
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const p = paramsRef.current
      if (dt > 0) {
        stateRef.current = stepIndicator(stateRef.current, dt, p.substance, p.dripping)
        if (stateRef.current.dripProgress >= 1) p.dripping = false
      }
      const st = stateRef.current
      const fs = fontPx(12, w, h)
      const hover = hoverRef.current
      const ph = st.displayPh
      const liquidColor = indicatorColor(p.indicator, ph)
      const juiceColor = indicatorColor(p.indicator, 7)

      clearThemedScene(ctx, w, h, 'chemistry')

      const bx = w * 0.5
      const top = h * 0.22
      const bottom = h * 0.66
      const bw = Math.min(w * 0.14, 78)
      const fillLevel = 0.22 + st.dripProgress * 0.48
      const liquidTop = bottom - 3 - fillLevel * (bottom - top - 6)

      // Indicator bottles (left) — room for side labels
      const bottleW = Math.min(52, w * 0.09)
      const bottleH = Math.min(72, h * 0.15)
      const indX = w * 0.1
      const indGap = 28
      const cabbageBox = { x: indX, y: h * 0.38, w: bottleW, h: bottleH }
      const turmericBox = {
        x: indX,
        y: cabbageBox.y + bottleH + indGap,
        w: bottleW,
        h: bottleH,
      }

      // Substance vials (right) — side labels, generous vertical gap
      const dropW = Math.min(44, w * 0.08)
      const dropH = 54
      const subX = w * 0.82
      const subGap = 26
      const dropY = h * 0.2
      const acidBox = { x: subX, y: dropY, w: dropW, h: dropH }
      const neutBox = { x: subX, y: dropY + dropH + subGap, w: dropW, h: dropH }
      const baseBox = { x: subX, y: dropY + 2 * (dropH + subGap), w: dropW, h: dropH }

      const dripBtn = {
        x: bx - 58,
        y: bottom + 28,
        w: 116,
        h: 30,
      }
      const beakerHit = { x: bx - bw, y: top, w: bw * 2, h: bottom - top }

      layoutRef.current = {
        cabbage: cabbageBox,
        turmeric: turmericBox,
        acid: acidBox,
        neutral: neutBox,
        base: baseBox,
        drip: dripBtn,
        beaker: beakerHit,
      }

      // Test flask — liquid clipped to glass
      drawHoverHalo(ctx, bx, (top + bottom) / 2, bw * 0.85, hover === 'beaker')
      withShadow(ctx, () => {
        drawErlenmeyerFlask(ctx, bx, top, bottom, bw, fillLevel, liquidColor, {
          stroke: hover === 'beaker' ? '#2980b9' : '#5d6d7e',
          lineWidth: hover === 'beaker' ? 3 : 2.5,
          alpha: 0.92,
        })
      })
      drawLabelPill(ctx, 'Test beaker', bx, bottom + 14, {
        fontSize: Math.max(10, fs - 1),
        bold: false,
      })

      // Falling drops while dripping
      if (p.dripping && st.dripProgress < 1) {
        const dropYAnim = top - 18 + ((st.time * 2.4) % 1) * (liquidTop - top + 28)
        ctx.fillStyle =
          p.substance === 'acid' ? '#e74c3c' : p.substance === 'base' ? '#3498db' : '#95a5a6'
        ctx.beginPath()
        ctx.arc(bx, dropYAnim, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(52,73,94,0.35)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(bx, top - 28)
        ctx.lineTo(bx, dropYAnim - 6)
        ctx.stroke()
      }

      drawLabelPill(ctx, 'Indicators', indX + bottleW / 2, cabbageBox.y - 18, {
        fontSize: Math.max(10, fs - 1),
      })
      drawBottle(
        ctx,
        cabbageBox,
        juiceColor,
        'Cabbage',
        p.indicator === 'cabbage',
        hover === 'ind-cabbage',
        fs,
        'right',
      )
      drawBottle(
        ctx,
        turmericBox,
        'rgb(240,200,40)',
        'Turmeric',
        p.indicator === 'turmeric',
        hover === 'ind-turmeric',
        fs,
        'right',
      )

      drawLabelPill(ctx, 'Substance', subX + dropW / 2, acidBox.y - 18, {
        fontSize: Math.max(10, fs - 1),
      })
      drawVial(ctx, acidBox, '#c0392b', 'Acid', p.substance === 'acid', hover === 'sub-acid', fs, 'left')
      drawVial(
        ctx,
        neutBox,
        '#7f8c8d',
        'Water',
        p.substance === 'neutral',
        hover === 'sub-neutral',
        fs,
        'left',
      )
      drawVial(ctx, baseBox, '#2980b9', 'Base', p.substance === 'base', hover === 'sub-base', fs, 'left')

      drawHoverHalo(ctx, dripBtn.x + dripBtn.w / 2, dripBtn.y + dripBtn.h / 2, 52, hover === 'drip')
      drawLabelPill(
        ctx,
        p.dripping && st.dripProgress < 1 ? 'Dripping…' : 'Tap to drip',
        dripBtn.x + dripBtn.w / 2,
        dripBtn.y + dripBtn.h / 2,
        {
          fontSize: fs,
          bg: p.dripping ? 'rgba(41,128,185,0.2)' : 'rgba(39,174,96,0.18)',
        },
      )

      drawValueChip(ctx, 'pH', ph.toFixed(1), w / 2, h * 0.09, {
        fontSize: fs + 1,
        accent: true,
      })
      drawLabelPill(
        ctx,
        `${phCategory(ph)} · ${expectedColor(p.indicator, p.substance)} expected`,
        w / 2,
        h * 0.09 + 28,
        {
          fontSize: Math.max(10, fs - 1),
          bold: false,
        },
      )

      if (hintShown.current) {
        drawHint(ctx, 'tap indicator · substance · then drip into beaker', w / 2, h - 16, w, h)
      }
    },
    [],
  )

  useCanvasLoop(canvasRef, draw, true, version, true)

  return (
    <SimShell
      title="Natural Indicators"
      subtitle="Cabbage juice and turmeric respond to acids and bases"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => {
        if (!paramsRef.current.dripping || stateRef.current.dripProgress >= 1) startDrip()
        else {
          paramsRef.current.dripping = !paramsRef.current.dripping
          setRunning(paramsRef.current.dripping)
        }
      }}
      onReset={() => {
        paramsRef.current = {
          indicator: 'cabbage',
          substance: 'neutral',
          dripping: false,
        }
        setIndicator('cabbage')
        setSubstance('neutral')
        resetMix()
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Setup">
            <ControlHint>Tap bottles on the canvas, or use these controls — then drip.</ControlHint>
            <ControlSelect
              label="Indicator"
              value={indicator}
              options={[
                { value: 'cabbage', label: 'Red cabbage juice' },
                { value: 'turmeric', label: 'Turmeric' },
              ]}
              onChange={(v) => {
                setIndicator(v as IndicatorType)
                paramsRef.current.indicator = v as IndicatorType
                resetMix()
                setVersion((n) => n + 1)
              }}
            />
            <ControlSelect
              label="Substance"
              value={substance}
              options={[
                { value: 'acid', label: 'Acid (lemon juice)' },
                { value: 'neutral', label: 'Neutral (water)' },
                { value: 'base', label: 'Base (soap)' },
              ]}
              onChange={(v) => {
                setSubstance(v as SubstanceType)
                paramsRef.current.substance = v as SubstanceType
                resetMix()
                setVersion((n) => n + 1)
              }}
            />
            <ControlStack>
              <button type="button" className="sim-shell-btn is-active" onClick={startDrip}>
                Drip into beaker
              </button>
            </ControlStack>
          </ControlSection>
          <ControlSection title="Observation">
            <ControlStats>
              <ControlStat label="pH" value={readout.ph.toFixed(1)} />
              <ControlStat label="Category" value={readout.category} />
              <ControlStat label="Expected" value={expectedColor(indicator, substance)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}

function drawBottle(
  ctx: CanvasRenderingContext2D,
  box: Box,
  color: string,
  label: string,
  selected: boolean,
  hover: boolean,
  fs: number,
  labelSide: 'left' | 'right',
) {
  const cx = box.x + box.w / 2
  const neckW = box.w * 0.32
  const bodyTop = box.y + box.h * 0.22
  drawHoverHalo(ctx, cx, box.y + box.h * 0.55, Math.min(box.w, box.h) * 0.55, hover || selected)

  // glass outline path (rounded bottle)
  const path = (c: CanvasRenderingContext2D) => {
    c.beginPath()
    c.moveTo(cx - neckW / 2, box.y + 4)
    c.lineTo(cx - neckW / 2, bodyTop)
    c.lineTo(box.x + 3, bodyTop + 8)
    c.lineTo(box.x + 3, box.y + box.h - 6)
    c.quadraticCurveTo(box.x + 3, box.y + box.h, cx, box.y + box.h)
    c.quadraticCurveTo(box.x + box.w - 3, box.y + box.h, box.x + box.w - 3, box.y + box.h - 6)
    c.lineTo(box.x + box.w - 3, bodyTop + 8)
    c.lineTo(cx + neckW / 2, bodyTop)
    c.lineTo(cx + neckW / 2, box.y + 4)
    c.closePath()
  }

  path(ctx)
  ctx.fillStyle = 'rgba(236,240,241,0.35)'
  ctx.fill()
  fillClippedLiquid(ctx, path, bodyTop, box.y + box.h - 2, 0.72, color, { inset: 2, alpha: 0.95 })
  path(ctx)
  ctx.strokeStyle = selected ? '#1a252f' : hover ? '#2980b9' : '#2c3e50'
  ctx.lineWidth = selected || hover ? 2.5 : 1.6
  ctx.stroke()

  // cork
  roundRect(ctx, cx - neckW / 2 - 1, box.y, neckW + 2, 8, 2)
  ctx.fillStyle = '#8b5a2b'
  ctx.fill()

  drawSideLabel(ctx, label, cx, box.y + box.h / 2, box.w / 2 + 8, labelSide, fs, selected)
}

function drawVial(
  ctx: CanvasRenderingContext2D,
  box: Box,
  color: string,
  label: string,
  selected: boolean,
  hover: boolean,
  fs: number,
  labelSide: 'left' | 'right',
) {
  const cx = box.x + box.w / 2
  const rimY = box.y + box.h * 0.18
  drawHoverHalo(ctx, cx, box.y + box.h * 0.55, Math.min(box.w, box.h) * 0.52, hover || selected)

  const path = (c: CanvasRenderingContext2D) => {
    roundRect(c, box.x + 4, rimY, box.w - 8, box.h * 0.78, 5)
  }

  path(ctx)
  ctx.fillStyle = 'rgba(236,240,241,0.35)'
  ctx.fill()
  fillClippedLiquid(ctx, path, rimY, box.y + box.h - 2, 0.7, color, { inset: 2, alpha: 0.95 })
  path(ctx)
  ctx.strokeStyle = selected ? '#1a252f' : hover ? '#2980b9' : '#566573'
  ctx.lineWidth = selected || hover ? 2.5 : 1.6
  ctx.stroke()

  // dropper bulb
  roundRect(ctx, cx - box.w * 0.18, box.y, box.w * 0.36, box.h * 0.2, 4)
  ctx.fillStyle = '#bdc3c7'
  ctx.fill()
  ctx.strokeStyle = '#7f8c8d'
  ctx.lineWidth = 1
  ctx.stroke()

  drawSideLabel(ctx, label, cx, box.y + box.h / 2, box.w / 2 + 8, labelSide, fs, selected)
}

function drawSideLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  cx: number,
  cy: number,
  offset: number,
  side: 'left' | 'right',
  fs: number,
  selected: boolean,
) {
  const x = side === 'right' ? cx + offset : cx - offset
  ctx.font = `600 ${Math.max(10, fs - 1)}px Roboto, sans-serif`
  ctx.textAlign = side === 'right' ? 'left' : 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = selected ? '#1a252f' : '#2c3e50'
  ctx.fillText(label, x, cy)
}
