import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlToggle,
} from '../../shared/Controls'
import { clearThemedScene, fontPx, roundRect, withShadow } from '../../shared/drawHelpers'
import { drawGlow, SCENE } from '../../shared/canvasTheme'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  METALS,
  NONMETALS,
  createMetalNonmetalState,
  cycleValue,
  stepMetalNonmetal,
} from './metalNonmetalModel'

type PanelLayout = { id: string; x: number; y: number; w: number; h: number }

type Layout = {
  metalPanel: PanelLayout
  nonmetalPanel: PanelLayout
  reactTrack: { x: number; y: number; w: number; h: number }
  reactKnob: { x: number; y: number }
}

export function MetalNonmetalSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createMetalNonmetalState())
  const paramsRef = useRef({ metal: 'Fe', nonmetal: 'O', reactivity: 0.5, showConductivity: true })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [metal, setMetal] = useState('Fe')
  const [nonmetal, setNonmetal] = useState('O')
  const [showConductivity, setShowConductivity] = useState(true)
  const [reactivity, setReactivity] = useState(0.5)
  const [version, setVersion] = useState(0)

  paramsRef.current = { metal, nonmetal, reactivity, showConductivity }

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = paramsRef.current
      setMetal(p.metal)
      setNonmetal(p.nonmetal)
      setReactivity(p.reactivity)
    }, 120)
    return () => clearInterval(id)
  }, [])

  useCanvasPointer(canvasRef, {
    cursorForHit: (id) => (id === 'reactivity' ? 'grab' : 'pointer'),
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      const m = L.metalPanel
      if (pt.x >= m.x && pt.x <= m.x + m.w && pt.y >= m.y && pt.y <= m.y + m.h) return 'metal'
      const n = L.nonmetalPanel
      if (pt.x >= n.x && pt.x <= n.x + n.w && pt.y >= n.y && pt.y <= n.y + n.h) return 'nonmetal'
      if (L.reactKnob && Math.hypot(pt.x - L.reactKnob.x, pt.y - L.reactKnob.y) < 18)
        return 'reactivity'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id || id === 'reactivity') return
      hintShown.current = false
      const p = paramsRef.current
      if (id === 'metal') p.metal = cycleValue(METALS, p.metal)
      else if (id === 'nonmetal') p.nonmetal = cycleValue(NONMETALS, p.nonmetal)
    },
    onDrag: (id, pt) => {
      if (id !== 'reactivity') return
      hintShown.current = false
      const L = layoutRef.current
      if (!L?.reactTrack) return
      const t = clamp((pt.x - L.reactTrack.x) / L.reactTrack.w, 0, 1)
      paramsRef.current.reactivity = t
    },
  })

  const metalInfo = METALS.find((m) => m.value === metal) ?? METALS[3]
  const nonmetalInfo = NONMETALS.find((n) => n.value === nonmetal) ?? NONMETALS[2]

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0 && running) stateRef.current = stepMetalNonmetal(stateRef.current, dt)
      const t = stateRef.current.time
      const p = paramsRef.current
      const mInfo = METALS.find((m) => m.value === p.metal) ?? METALS[3]
      const nInfo = NONMETALS.find((n) => n.value === p.nonmetal) ?? NONMETALS[2]
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)

      clearThemedScene(ctx, w, h, 'chemistry')

      const barW = w * 0.38
      const barH = h * 0.22
      const leftX = w * 0.08
      const rightX = w * 0.54
      const barY = h * 0.14

      layoutRef.current = {
        metalPanel: { id: 'metal', x: leftX, y: barY, w: barW, h: barH },
        nonmetalPanel: { id: 'nonmetal', x: rightX, y: barY, w: barW, h: barH },
        reactTrack: { x: 0, y: 0, w: 1, h: 1 },
        reactKnob: { x: 0, y: 0 },
      }

      drawLabelPill(ctx, 'Metal — conducts', leftX + barW / 2, barY - 14, { fontSize: fs })
      drawLabelPill(ctx, 'Non-metal — insulates', rightX + barW / 2, barY - 14, { fontSize: fs })

      drawHoverHalo(ctx, leftX + barW / 2, barY + barH / 2, barW * 0.48, hover === 'metal')
      withShadow(ctx, () => {
        roundRect(ctx, leftX, barY, barW, barH, 10)
        ctx.fillStyle = mInfo.color
        ctx.fill()
      })
      ctx.strokeStyle = hover === 'metal' ? '#2980b9' : '#566573'
      ctx.lineWidth = hover === 'metal' ? 3 : 2
      ctx.stroke()

      drawHoverHalo(ctx, rightX + barW / 2, barY + barH / 2, barW * 0.48, hover === 'nonmetal')
      roundRect(ctx, rightX, barY, barW, barH, 10)
      ctx.fillStyle = nInfo.color
      ctx.globalAlpha = 0.85
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = hover === 'nonmetal' ? '#2980b9' : '#566573'
      ctx.lineWidth = hover === 'nonmetal' ? 3 : 2
      ctx.stroke()

      ctx.font = `700 ${fs + 4}px Roboto, sans-serif`
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.fillText(mInfo.value, leftX + barW / 2, barY + barH / 2 + 6)
      ctx.fillText(nInfo.value, rightX + barW / 2, barY + barH / 2 + 6)

      if (p.showConductivity) {
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

        for (let i = 0; i < 6; i++) {
          const phase = (t * 1.8 + i * 0.16) % 1
          const ex = leftX + phase * barW
          if (running) {
            drawGlow(ctx, ex, wireY, 14, SCENE.chemistry.hot, 0.45)
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

        drawValueChip(ctx, 'Conducts', 'high ✓', leftX + barW / 2, wireY + fs + 14, {
          fontSize: Math.max(10, fs - 1),
          accent: true,
        })
        drawValueChip(ctx, 'Conducts', 'low ✗', rightX + barW / 2, wireY + fs + 14, {
          fontSize: Math.max(10, fs - 1),
        })
      }

      const demoY = h * 0.62
      const demoH = h * 0.28
      roundRect(ctx, w * 0.08, demoY, w * 0.84, demoH, 12)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 2
      ctx.stroke()

      drawLabelPill(ctx, 'Reactivity demo (oxidation / rust)', w * 0.08 + 14 + 120, demoY + fs + 8, {
        align: 'left',
        fontSize: fs,
      })

      const sampleX = w * 0.22
      const sampleY = demoY + demoH * 0.55
      const sampleR = Math.min(w, h) * 0.07
      ctx.beginPath()
      ctx.arc(sampleX, sampleY, sampleR, 0, Math.PI * 2)
      const rust = p.reactivity
      ctx.fillStyle = `rgb(${Math.round(127 + rust * 80)}, ${Math.round(140 - rust * 60)}, ${Math.round(141 - rust * 90)})`
      ctx.fill()
      ctx.strokeStyle = '#566573'
      ctx.lineWidth = 2
      ctx.stroke()

      if (running && rust > 0.1) {
        const n = Math.floor(4 + rust * 12)
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + t * 2
          const dist = sampleR + 8 + (Math.sin(t * 3 + i) * 0.5 + 0.5) * rust * 28
          const px = sampleX + Math.cos(ang) * dist
          const py = sampleY + Math.sin(ang) * dist - t * 20 * rust
          ctx.beginPath()
          ctx.arc(px, py, 3 + rust * 2, 0, Math.PI * 2)
          ctx.fillStyle = nInfo.color
          ctx.globalAlpha = 0.7
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      drawValueChip(
        ctx,
        'Reactivity',
        `${Math.round(rust * 100)}%`,
        w * 0.38,
        sampleY - 8,
        { fontSize: fs, align: 'left' },
      )
      drawValueChip(ctx, '', `${mInfo.value} + ${nInfo.value} → oxide`, w * 0.38, sampleY + fs + 4, {
        fontSize: Math.max(10, fs - 1),
        align: 'left',
      })

      // Drag track for reactivity (direct manipulation)
      const trackX = w * 0.38
      const trackY = sampleY + fs + 28
      const trackW = w * 0.42
      const trackH = 10
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      roundRect(ctx, trackX, trackY, trackW, trackH, 5)
      ctx.fill()
      const knobX = trackX + rust * trackW
      drawHoverHalo(ctx, knobX, trackY + trackH / 2, 16, hover === 'reactivity')
      ctx.fillStyle = '#e67e22'
      ctx.beginPath()
      ctx.arc(knobX, trackY + trackH / 2, hover === 'reactivity' ? 9 : 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      drawLabelPill(ctx, 'drag', knobX, trackY - 12, {
        fontSize: Math.max(9, fs - 3),
        bold: false,
      })

      if (layoutRef.current) {
        layoutRef.current.reactTrack = { x: trackX, y: trackY - 8, w: trackW, h: trackH + 16 }
        layoutRef.current.reactKnob = { x: knobX, y: trackY + trackH / 2 }
      }

      if (hintShown.current) {
        drawHint(ctx, 'tap metal/non-metal · drag reactivity knob', w / 2, h - 18, w, h)
      }
    },
    [running, showConductivity, metalInfo, nonmetalInfo, reactivity],
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
        paramsRef.current = { metal: 'Fe', nonmetal: 'O', reactivity: 0.5, showConductivity: true }
        setMetal('Fe')
        setNonmetal('O')
        setShowConductivity(true)
        setReactivity(0.5)
        setRunning(true)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Compare">
            <ControlSelect
              label="Metal"
              value={metal}
              options={METALS.map((m) => ({ value: m.value, label: m.label }))}
              onChange={(v) => {
                setMetal(v)
                paramsRef.current.metal = v
              }}
            />
            <ControlSelect
              label="Non-metal"
              value={nonmetal}
              options={NONMETALS.map((n) => ({ value: n.value, label: n.label }))}
              onChange={(v) => {
                setNonmetal(v)
                paramsRef.current.nonmetal = v
              }}
            />
          </ControlSection>
          <ControlSection title="Visualization">
            <ControlHint>Play to animate electron flow and reaction particles.</ControlHint>
            <ControlToggle
              label="Show conductivity demo"
              checked={showConductivity}
              onChange={(v) => {
                setShowConductivity(v)
                paramsRef.current.showConductivity = v
              }}
            />
            <ControlSlider
              label="Reactivity intensity"
              value={reactivity}
              min={0}
              max={1}
              step={0.05}
              display={`${Math.round(reactivity * 100)}%`}
              onChange={(v) => {
                setReactivity(v)
                paramsRef.current.reactivity = v
              }}
            />
          </ControlSection>
        </>
      }
    />
  )
}
