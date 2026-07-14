import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
  ControlStack,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect, withShadow } from '../../shared/drawHelpers'
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

type Layout = {
  cabbage: { x: number; y: number; w: number; h: number }
  turmeric: { x: number; y: number; w: number; h: number }
  acid: { x: number; y: number; w: number; h: number }
  neutral: { x: number; y: number; w: number; h: number }
  base: { x: number; y: number; w: number; h: number }
  drip: { x: number; y: number; w: number; h: number }
  beaker: { x: number; y: number; w: number; h: number }
}

function inBox(
  pt: { x: number; y: number },
  b: { x: number; y: number; w: number; h: number },
) {
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
      const top = h * 0.2
      const bottom = h * 0.68
      const bw = Math.min(w * 0.16, 90)
      const level = 0.22 + st.dripProgress * 0.48
      const liquidTop = bottom - 10 - level * (bottom - top - 30)

      // Indicator bottles (left)
      const bottleW = Math.min(64, w * 0.12)
      const bottleH = Math.min(78, h * 0.16)
      const cabbageBox = { x: w * 0.06, y: h * 0.42, w: bottleW, h: bottleH }
      const turmericBox = { x: w * 0.06, y: h * 0.42 + bottleH + 14, w: bottleW, h: bottleH }

      // Substance droppers (right)
      const dropW = Math.min(54, w * 0.1)
      const dropH = 56
      const dropY = h * 0.18
      const acidBox = { x: w * 0.78, y: dropY, w: dropW, h: dropH }
      const neutBox = { x: w * 0.78, y: dropY + dropH + 10, w: dropW, h: dropH }
      const baseBox = { x: w * 0.78, y: dropY + 2 * (dropH + 10), w: dropW, h: dropH }

      const dripBtn = {
        x: bx - 54,
        y: bottom + 18,
        w: 108,
        h: 28,
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

      // Beaker
      drawHoverHalo(ctx, bx, (top + bottom) / 2, bw * 1.1, hover === 'beaker')
      withShadow(ctx, () => {
        ctx.strokeStyle = '#5d6d7e'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(bx - bw * 0.35, top)
        ctx.lineTo(bx - bw * 0.35, top + (bottom - top) * 0.15)
        ctx.lineTo(bx - bw, bottom)
        ctx.lineTo(bx + bw, bottom)
        ctx.lineTo(bx + bw * 0.35, top + (bottom - top) * 0.15)
        ctx.lineTo(bx + bw * 0.35, top)
        ctx.stroke()

        ctx.fillStyle = liquidColor
        ctx.globalAlpha = 0.92
        ctx.beginPath()
        ctx.moveTo(bx - bw + 8, bottom - 8)
        ctx.lineTo(bx - bw + 8, liquidTop)
        ctx.lineTo(bx + bw - 8, liquidTop)
        ctx.lineTo(bx + bw - 8, bottom - 8)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1
      })
      drawLabelPill(ctx, 'Test beaker', bx, bottom + 8, {
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

      // Indicator bottles
      drawBottle(
        ctx,
        cabbageBox,
        juiceColor,
        'Cabbage',
        p.indicator === 'cabbage',
        hover === 'ind-cabbage',
        fs,
      )
      drawBottle(
        ctx,
        turmericBox,
        'rgb(240,200,40)',
        'Turmeric',
        p.indicator === 'turmeric',
        hover === 'ind-turmeric',
        fs,
      )
      drawLabelPill(ctx, 'Indicators', cabbageBox.x + cabbageBox.w / 2, cabbageBox.y - 14, {
        fontSize: Math.max(10, fs - 1),
      })

      // Substance vials
      drawVial(ctx, acidBox, '#c0392b', 'Acid', p.substance === 'acid', hover === 'sub-acid', fs)
      drawVial(
        ctx,
        neutBox,
        '#7f8c8d',
        'Water',
        p.substance === 'neutral',
        hover === 'sub-neutral',
        fs,
      )
      drawVial(ctx, baseBox, '#2980b9', 'Base', p.substance === 'base', hover === 'sub-base', fs)
      drawLabelPill(ctx, 'Substance', acidBox.x + acidBox.w / 2, acidBox.y - 14, {
        fontSize: Math.max(10, fs - 1),
      })

      // Drip CTA
      drawHoverHalo(ctx, dripBtn.x + dripBtn.w / 2, dripBtn.y + dripBtn.h / 2, 60, hover === 'drip')
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

      drawValueChip(ctx, 'pH', ph.toFixed(1), w / 2, h * 0.1, {
        fontSize: fs + 1,
        accent: true,
      })
      drawLabelPill(ctx, `${phCategory(ph)} · ${expectedColor(p.indicator, p.substance)} expected`, w / 2, h * 0.1 + 28, {
        fontSize: Math.max(10, fs - 1),
        bold: false,
      })

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
  box: { x: number; y: number; w: number; h: number },
  color: string,
  label: string,
  selected: boolean,
  hover: boolean,
  fs: number,
) {
  drawHoverHalo(ctx, box.x + box.w / 2, box.y + box.h / 2, box.w * 0.7, hover || selected)
  roundRect(ctx, box.x, box.y, box.w, box.h, 8)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = selected ? '#1a252f' : hover ? '#2980b9' : '#2c3e50'
  ctx.lineWidth = selected || hover ? 2.5 : 1.5
  ctx.stroke()
  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${Math.max(9, fs - 2)}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(label, box.x + box.w / 2, box.y + box.h + 12)
}

function drawVial(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  color: string,
  label: string,
  selected: boolean,
  hover: boolean,
  fs: number,
) {
  drawHoverHalo(ctx, box.x + box.w / 2, box.y + box.h / 2, box.w * 0.7, hover || selected)
  ctx.fillStyle = '#bdc3c7'
  roundRect(ctx, box.x + box.w * 0.3, box.y, box.w * 0.4, box.h * 0.28, 3)
  ctx.fill()
  roundRect(ctx, box.x + 4, box.y + box.h * 0.22, box.w - 8, box.h * 0.7, 6)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = selected ? '#1a252f' : hover ? '#2980b9' : '#566573'
  ctx.lineWidth = selected || hover ? 2.5 : 1.5
  ctx.stroke()
  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${Math.max(9, fs - 2)}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(label, box.x + box.w / 2, box.y + box.h + 12)
}
