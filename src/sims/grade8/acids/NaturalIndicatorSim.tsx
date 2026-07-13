import { useCallback, useRef, useState } from 'react'
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

type IndicatorType = 'cabbage' | 'turmeric'
type SubstanceType = 'acid' | 'neutral' | 'base'

export interface IndicatorState {
  dripProgress: number
  mixedPh: number
  time: number
}

export function createIndicatorState(): IndicatorState {
  return { dripProgress: 0, mixedPh: 7, time: 0 }
}

export function stepIndicator(
  s: IndicatorState,
  dt: number,
  substance: SubstanceType,
): IndicatorState {
  const targetPh = substance === 'acid' ? 2.5 : substance === 'base' ? 11 : 7
  let { dripProgress } = s
  dripProgress = Math.min(1, dripProgress + dt * 0.5)
  const mix = dripProgress
  const mixedPh = 7 + (targetPh - 7) * mix
  return { ...s, dripProgress, mixedPh, time: s.time + dt }
}

/** Cabbage: pink/red acidic, purple neutral, blue/green basic. */
export function cabbageColor(ph: number): string {
  if (ph < 5) return `rgb(${220}, ${60 + ph * 10}, ${90})`
  if (ph < 6.5) return `rgb(${180}, ${80}, ${140})`
  if (ph <= 7.5) return 'rgb(120, 60, 160)'
  if (ph < 10) return `rgb(${50}, ${100 + (ph - 7) * 30}, ${200})`
  return `rgb(${40}, ${140}, ${120})`
}

/** Turmeric: yellow in acid/neutral, red-brown in base. */
export function turmericColor(ph: number): string {
  if (ph < 8) return 'rgb(240, 200, 40)'
  const t = Math.min(1, (ph - 8) / 4)
  return `rgb(${220 - t * 80}, ${120 - t * 60}, ${30})`
}

export function indicatorColor(type: IndicatorType, ph: number): string {
  return type === 'cabbage' ? cabbageColor(ph) : turmericColor(ph)
}

export function NaturalIndicatorSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createIndicatorState())
  const [running, setRunning] = useState(false)
  const [indicator, setIndicator] = useState<IndicatorType>('cabbage')
  const [substance, setSubstance] = useState<SubstanceType>('neutral')
  const [version, setVersion] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const s = stateRef.current
      if (dt > 0 && running) stateRef.current = stepIndicator(s, dt, substance)
      const st = stateRef.current
      const fs = fontPx(13, w, h)
      const ph = st.mixedPh

      ctx.fillStyle = '#f7f9fb'
      ctx.fillRect(0, 0, w, h)

      const bx = w * 0.5
      const top = h * 0.18
      const bottom = h * 0.72
      const bw = Math.min(w * 0.18, 100)

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

      const juiceColor = indicatorColor(indicator, 7)
      const liquidColor = indicatorColor(indicator, ph)
      const level = 0.25 + st.dripProgress * 0.45
      const liquidTop = bottom - 10 - level * (bottom - top - 30)

      ctx.fillStyle = liquidColor
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.moveTo(bx - bw + 8, bottom - 8)
      ctx.lineTo(bx - bw + 8, liquidTop)
      ctx.lineTo(bx + bw - 8, liquidTop)
      ctx.lineTo(bx + bw - 8, bottom - 8)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1

      if (running && st.dripProgress < 1) {
        const dropY = top - 20 + ((st.time * 2.5) % 1) * (liquidTop - top + 30)
        ctx.fillStyle =
          substance === 'acid' ? '#e74c3c' : substance === 'base' ? '#3498db' : '#95a5a6'
        ctx.beginPath()
        ctx.arc(bx, dropY, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(52,73,94,0.4)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(bx, top - 30)
        ctx.lineTo(bx, dropY - 6)
        ctx.stroke()
      }

      const dropperX = w * 0.78
      ctx.fillStyle = '#bdc3c7'
      roundRect(ctx, dropperX - 8, h * 0.06, 16, h * 0.12, 4)
      ctx.fill()
      ctx.fillStyle =
        substance === 'acid' ? '#c0392b' : substance === 'base' ? '#2980b9' : '#7f8c8d'
      roundRect(ctx, dropperX - 5, h * 0.06 + 8, 10, 28, 3)
      ctx.fill()

      ctx.fillStyle = juiceColor
      roundRect(ctx, w * 0.12, h * 0.55, 56, 72, 8)
      ctx.fill()
      ctx.strokeStyle = '#2c3e50'
      ctx.lineWidth = 1.5
      roundRect(ctx, w * 0.12, h * 0.55, 56, 72, 8)
      ctx.stroke()

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(
        indicator === 'cabbage' ? 'Red cabbage juice' : 'Turmeric paper',
        w * 0.12 + 28,
        h * 0.55 - 10,
      )
      ctx.fillText('Test beaker', bx, bottom + fs + 10)

      const label =
        ph < 6 ? 'Acidic' : ph > 8 ? 'Basic' : 'Neutral'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.fillText(`${label} · pH ≈ ${ph.toFixed(1)}`, w / 2, h - 24)
      ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
      ctx.fillStyle = '#5d6d7e'
      ctx.fillText('Natural indicators change color with H⁺ or OH⁻ concentration', w / 2, h - 8)
    },
    [indicator, running, substance],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Natural Indicators"
      subtitle="Cabbage juice and turmeric respond to acids and bases"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createIndicatorState()
        setRunning(false)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Setup">
            <ControlHint>Press Play to drip the chosen substance into the indicator beaker.</ControlHint>
            <ControlSelect
              label="Indicator"
              value={indicator}
              options={[
                { value: 'cabbage', label: 'Red cabbage juice' },
                { value: 'turmeric', label: 'Turmeric' },
              ]}
              onChange={(v) => setIndicator(v as IndicatorType)}
            />
            <ControlSelect
              label="Substance"
              value={substance}
              options={[
                { value: 'acid', label: 'Acid (lemon juice)' },
                { value: 'neutral', label: 'Neutral (water)' },
                { value: 'base', label: 'Base (soap)' },
              ]}
              onChange={(v) => setSubstance(v as SubstanceType)}
            />
          </ControlSection>
          <ControlSection title="Observation">
            <ControlStats>
              <ControlStat
                label="Expected"
                value={
                  indicator === 'cabbage'
                    ? substance === 'acid'
                      ? 'Pink / red'
                      : substance === 'base'
                        ? 'Blue / green'
                        : 'Purple'
                    : substance === 'base'
                      ? 'Red-brown'
                      : 'Yellow'
                }
              />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
