import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlToggle,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

const METALS = [
  { value: 'Na', label: 'Sodium (Na)', color: '#bdc3c7' },
  { value: 'Mg', label: 'Magnesium (Mg)', color: '#aeb6bf' },
  { value: 'Al', label: 'Aluminum (Al)', color: '#95a5a6' },
  { value: 'Fe', label: 'Iron (Fe)', color: '#7f8c8d' },
] as const

const NONMETALS = [
  { value: 'C', label: 'Carbon (C)', color: '#2c3e50' },
  { value: 'N', label: 'Nitrogen (N)', color: '#3498db' },
  { value: 'O', label: 'Oxygen (O)', color: '#e74c3c' },
  { value: 'Cl', label: 'Chlorine (Cl)', color: '#27ae60' },
] as const

export interface MetalNonmetalState {
  time: number
}

export function createMetalNonmetalState(): MetalNonmetalState {
  return { time: 0 }
}

export function stepMetalNonmetal(s: MetalNonmetalState, dt: number): MetalNonmetalState {
  return { time: s.time + dt }
}

export function MetalNonmetalSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createMetalNonmetalState())
  const [running, setRunning] = useState(true)
  const [metal, setMetal] = useState('Fe')
  const [nonmetal, setNonmetal] = useState('O')
  const [showConductivity, setShowConductivity] = useState(true)
  const [reactivity, setReactivity] = useState(0.5)
  const [version, setVersion] = useState(0)

  const metalInfo = METALS.find((m) => m.value === metal) ?? METALS[3]
  const nonmetalInfo = NONMETALS.find((n) => n.value === nonmetal) ?? NONMETALS[2]

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current = stepMetalNonmetal(stateRef.current, dt)
      const t = stateRef.current.time
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const barW = w * 0.38
      const barH = h * 0.22
      const leftX = w * 0.08
      const rightX = w * 0.54
      const barY = h * 0.14

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Metal — conducts', leftX + barW / 2, barY - 14)
      ctx.fillText('Non-metal — insulates', rightX + barW / 2, barY - 14)

      roundRect(ctx, leftX, barY, barW, barH, 10)
      ctx.fillStyle = metalInfo.color
      ctx.fill()
      ctx.strokeStyle = '#566573'
      ctx.lineWidth = 2
      ctx.stroke()

      roundRect(ctx, rightX, barY, barW, barH, 10)
      ctx.fillStyle = nonmetalInfo.color
      ctx.globalAlpha = 0.85
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#566573'
      ctx.stroke()

      ctx.font = `700 ${fs + 4}px Roboto, sans-serif`
      ctx.fillStyle = '#fff'
      ctx.fillText(metalInfo.value, leftX + barW / 2, barY + barH / 2 + 6)
      ctx.fillText(nonmetalInfo.value, rightX + barW / 2, barY + barH / 2 + 6)

      if (showConductivity) {
        const wireY = barY + barH + h * 0.06
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(leftX, wireY)
        ctx.lineTo(leftX + barW, wireY)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(rightX, wireY)
        ctx.lineTo(rightX + barW, wireY)
        ctx.stroke()

        ctx.fillStyle = '#1a252f'
        ctx.font = `${fs}px Roboto, sans-serif`
        ctx.fillText('Circuit wire', leftX + barW / 2, wireY + fs + 8)

        for (let i = 0; i < 6; i++) {
          const phase = (t * 1.8 + i * 0.16) % 1
          const ex = leftX + phase * barW
          if (running) {
            ctx.beginPath()
            ctx.arc(ex, wireY, 5, 0, Math.PI * 2)
            ctx.fillStyle = '#f1c40f'
            ctx.fill()
          }
        }

        for (let i = 0; i < 4; i++) {
          const phase = (t * 0.4 + i * 0.25) % 1
          const ex = rightX + phase * barW
          ctx.beginPath()
          ctx.arc(ex, wireY, 5, 0, Math.PI * 2)
          ctx.fillStyle = '#bdc3c7'
          ctx.fill()
          if (running && phase > 0.35 && phase < 0.55) {
            ctx.strokeStyle = '#e74c3c'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(ex - 8, wireY - 10)
            ctx.lineTo(ex + 8, wireY + 10)
            ctx.moveTo(ex + 8, wireY - 10)
            ctx.lineTo(ex - 8, wireY + 10)
            ctx.stroke()
          }
        }

        ctx.font = `${Math.max(10, fs - 1)}px Roboto, sans-serif`
        ctx.fillStyle = '#27ae60'
        ctx.fillText('Electrons flow ✓', leftX + barW / 2, wireY + fs + 24)
        ctx.fillStyle = '#c0392b'
        ctx.fillText('Electrons blocked ✗', rightX + barW / 2, wireY + fs + 24)
      }

      const demoY = h * 0.62
      const demoH = h * 0.28
      roundRect(ctx, w * 0.08, demoY, w * 0.84, demoH, 12)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('Reactivity demo (oxidation / rust)', w * 0.08 + 14, demoY + fs + 8)

      const sampleX = w * 0.22
      const sampleY = demoY + demoH * 0.55
      const sampleR = Math.min(w, h) * 0.07
      ctx.beginPath()
      ctx.arc(sampleX, sampleY, sampleR, 0, Math.PI * 2)
      const rust = reactivity
      ctx.fillStyle = `rgb(${Math.round(127 + rust * 80)}, ${Math.round(140 - rust * 60)}, ${Math.round(141 - rust * 90)})`
      ctx.fill()
      ctx.strokeStyle = '#566573'
      ctx.lineWidth = 2
      ctx.stroke()

      if (running && reactivity > 0.1) {
        const n = Math.floor(4 + reactivity * 12)
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + t * 2
          const dist = sampleR + 8 + (Math.sin(t * 3 + i) * 0.5 + 0.5) * reactivity * 28
          const px = sampleX + Math.cos(ang) * dist
          const py = sampleY + Math.sin(ang) * dist - t * 20 * reactivity
          ctx.beginPath()
          ctx.arc(px, py, 3 + reactivity * 2, 0, Math.PI * 2)
          ctx.fillStyle = nonmetalInfo.color
          ctx.globalAlpha = 0.7
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      ctx.fillStyle = '#5d6d7e'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(
        `${metalInfo.value} + ${nonmetalInfo.value} → oxide layer (${Math.round(reactivity * 100)}% intensity)`,
        w * 0.38,
        sampleY - 8,
      )
      ctx.fillText('Metals tend to lose electrons and react.', w * 0.38, sampleY + fs + 4)
      ctx.fillText('Non-metals hold electrons tightly.', w * 0.38, sampleY + (fs + 4) * 2)
    },
    [metalInfo, nonmetalInfo, reactivity, running, showConductivity],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Metals vs Non-metals"
      subtitle="Conductivity, electron flow, and reactivity"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = createMetalNonmetalState()
        setMetal('Fe')
        setNonmetal('O')
        setShowConductivity(true)
        setReactivity(0.5)
        setRunning(true)
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Compare">
            <ControlSelect
              label="Metal"
              value={metal}
              options={METALS.map((m) => ({ value: m.value, label: m.label }))}
              onChange={setMetal}
            />
            <ControlSelect
              label="Non-metal"
              value={nonmetal}
              options={NONMETALS.map((n) => ({ value: n.value, label: n.label }))}
              onChange={setNonmetal}
            />
          </ControlSection>
          <ControlSection title="Visualization">
            <ControlHint>Play to animate electron flow and reaction particles.</ControlHint>
            <ControlToggle
              label="Show conductivity demo"
              checked={showConductivity}
              onChange={setShowConductivity}
            />
            <ControlSlider
              label="Reactivity intensity"
              value={reactivity}
              min={0}
              max={1}
              step={0.05}
              display={`${Math.round(reactivity * 100)}%`}
              onChange={setReactivity}
            />
          </ControlSection>
        </>
      }
    />
  )
}
