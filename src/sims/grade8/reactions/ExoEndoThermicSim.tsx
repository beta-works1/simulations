import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  createThermicState,
  resetThermicState,
  stepThermic,
  type ThermicMode,
} from './exoEndoModel'

type BtnLayout = { id: ThermicMode; x: number; y: number; w: number; h: number }

type Layout = {
  exoBtn: BtnLayout
  endoBtn: BtnLayout
  beaker: { x: number; y: number; w: number; h: number }
}

export function ExoEndoThermicSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createThermicState())
  const paramsRef = useRef({ mode: 'exothermic' as ThermicMode })
  const layoutRef = useRef<Layout | null>(null)
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<ThermicMode>('exothermic')
  const [version, setVersion] = useState(0)
  const [tempReadout, setTempReadout] = useState(22)

  paramsRef.current.mode = mode

  useEffect(() => {
    const id = window.setInterval(() => setTempReadout(stateRef.current.temperature), 150)
    return () => clearInterval(id)
  }, [])

  const switchMode = (next: ThermicMode) => {
    hintShown.current = false
    paramsRef.current.mode = next
    setMode(next)
    stateRef.current = resetThermicState()
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      const L = layoutRef.current
      if (!L) return null
      const e = L.exoBtn
      if (pt.x >= e.x && pt.x <= e.x + e.w && pt.y >= e.y && pt.y <= e.y + e.h) return 'exo'
      const n = L.endoBtn
      if (pt.x >= n.x && pt.x <= n.x + n.w && pt.y >= n.y && pt.y <= n.y + n.h) return 'endo'
      const b = L.beaker
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return 'beaker'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      if (id === 'exo') switchMode('exothermic')
      else if (id === 'endo') switchMode('endothermic')
      else if (id === 'beaker') {
        switchMode(paramsRef.current.mode === 'exothermic' ? 'endothermic' : 'exothermic')
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const currentMode = paramsRef.current.mode
      if (dt > 0) stateRef.current = stepThermic(stateRef.current, dt, currentMode, running)
      const s = stateRef.current
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)
      const isExo = currentMode === 'exothermic'

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const btnW = 140
      const btnH = 30
      const btnY = 48
      layoutRef.current = {
        exoBtn: { id: 'exothermic', x: w / 2 - btnW - 8, y: btnY, w: btnW, h: btnH },
        endoBtn: { id: 'endothermic', x: w / 2 + 8, y: btnY, w: btnW, h: btnH },
        beaker: { x: w * 0.38, y: h * 0.38, w: w * 0.24, h: h * 0.38 },
      }

      drawLabelPill(ctx, isExo ? 'Exothermic — releases heat' : 'Endothermic — absorbs heat', w / 2, 28, {
        fontSize: fs + 2,
      })

      const L = layoutRef.current
      drawHoverHalo(ctx, L.exoBtn.x + btnW / 2, btnY + btnH / 2, btnW * 0.5, hover === 'exo')
      drawLabelPill(ctx, 'Exothermic', L.exoBtn.x + btnW / 2, btnY + btnH / 2, {
        fontSize: fs,
        bg: isExo ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.9)',
        bold: isExo,
      })
      drawHoverHalo(ctx, L.endoBtn.x + btnW / 2, btnY + btnH / 2, btnW * 0.5, hover === 'endo')
      drawLabelPill(ctx, 'Endothermic', L.endoBtn.x + btnW / 2, btnY + btnH / 2, {
        fontSize: fs,
        bg: !isExo ? 'rgba(52,152,219,0.2)' : 'rgba(255,255,255,0.9)',
        bold: !isExo,
      })

      const bx = L.beaker.x
      const by = L.beaker.y
      const bw = L.beaker.w
      const bh = L.beaker.h

      drawHoverHalo(ctx, bx + bw / 2, by + bh / 2, Math.max(bw, bh) * 0.45, hover === 'beaker')

      ctx.strokeStyle = '#5dade2'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(bx + bw * 0.15, by)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx, by + bh)
      ctx.lineTo(bx + bw, by + bh)
      ctx.lineTo(bx + bw, by)
      ctx.lineTo(bx + bw * 0.85, by)
      ctx.stroke()

      const liquidLevel = 0.35 + ((s.temperature - 8) / 40) * 0.45
      const liquidY = by + bh * (1 - liquidLevel)
      ctx.fillStyle = isExo ? 'rgba(231,76,60,0.55)' : 'rgba(52,152,219,0.55)'
      ctx.fillRect(bx + 3, liquidY, bw - 6, by + bh - liquidY - 3)

      drawLabelPill(ctx, 'Beaker', bx + bw / 2, by + bh + fs + 10, { fontSize: fs, bold: false })

      const tx = bx + bw + w * 0.08
      const ty = by + bh * 0.15
      const th = bh * 0.85
      ctx.fillStyle = '#ecf0f1'
      ctx.fillRect(tx, ty, 14, th)
      ctx.strokeStyle = '#566573'
      ctx.lineWidth = 2
      ctx.strokeRect(tx, ty, 14, th)

      const tempNorm = (s.temperature - 8) / 40
      const mercuryH = th * Math.max(0.08, Math.min(0.95, tempNorm))
      ctx.fillStyle = isExo ? '#e74c3c' : '#3498db'
      ctx.fillRect(tx + 2, ty + th - mercuryH, 10, mercuryH)

      ctx.beginPath()
      ctx.arc(tx + 7, ty + th + 12, 14, 0, Math.PI * 2)
      ctx.fill()

      drawValueChip(ctx, 'T', `${s.temperature.toFixed(1)} °C`, tx + 50, ty + th * 0.5, {
        fontSize: fs,
        accent: true,
      })

      const arrowX = w * 0.12
      const arrowY = h * 0.55
      ctx.strokeStyle = isExo ? '#e74c3c' : '#3498db'
      ctx.fillStyle = isExo ? '#e74c3c' : '#3498db'
      ctx.lineWidth = 4
      ctx.beginPath()
      if (isExo) {
        ctx.moveTo(arrowX, arrowY - 50)
        ctx.lineTo(arrowX, arrowY + 30)
        ctx.lineTo(arrowX - 12, arrowY + 10)
        ctx.moveTo(arrowX, arrowY + 30)
        ctx.lineTo(arrowX + 12, arrowY + 10)
      } else {
        ctx.moveTo(arrowX, arrowY + 30)
        ctx.lineTo(arrowX, arrowY - 50)
        ctx.lineTo(arrowX - 12, arrowY - 30)
        ctx.moveTo(arrowX, arrowY - 50)
        ctx.lineTo(arrowX + 12, arrowY - 30)
      }
      ctx.stroke()
      ctx.fill()

      drawLabelPill(ctx, isExo ? 'Energy OUT' : 'Energy IN', arrowX, arrowY + 58, {
        fontSize: fs,
        bg: isExo ? 'rgba(231,76,60,0.18)' : 'rgba(52,152,219,0.18)',
        fg: isExo ? '#c0392b' : '#2471a3',
      })

      if (running) {
        const bubbles = isExo ? 8 : 4
        for (let i = 0; i < bubbles; i++) {
          const phase = (s.time * 1.2 + i * 0.37) % 1
          const bx2 = bx + bw * 0.2 + (i % 3) * (bw * 0.25)
          const by2 = liquidY - phase * (liquidY - by) * 0.8
          ctx.beginPath()
          ctx.arc(bx2, by2, 3 + (i % 2), 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.fill()
        }
      }

      roundRect(ctx, w * 0.55, h * 0.68, w * 0.38, h * 0.22, 10)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#bdc3c7'
      ctx.lineWidth = 2
      ctx.stroke()
      const note = isExo
        ? 'Bonds form → energy released\nSurroundings get warmer'
        : 'Bonds break → energy absorbed\nSurroundings get cooler'
      note.split('\n').forEach((line, i) => {
        drawLabelPill(ctx, line, w * 0.55 + 12 + 100, h * 0.68 + fs + 8 + i * (fs + 8), {
          align: 'left',
          fontSize: Math.max(10, fs - 1),
          bold: false,
        })
      })

      if (hintShown.current) {
        drawHint(ctx, 'click beaker or mode buttons to switch', w / 2, h - 18, w, h)
      }
    },
    [mode, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Exothermic vs Endothermic"
      subtitle="Energy flow and temperature change during reactions"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stateRef.current = resetThermicState()
        paramsRef.current.mode = 'exothermic'
        setMode('exothermic')
        setRunning(true)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Reaction type">
            <ControlHint>Play to watch the thermometer respond over time.</ControlHint>
            <ControlSelect
              label="Energy change"
              value={mode}
              options={[
                { value: 'exothermic', label: 'Exothermic (heat out)' },
                { value: 'endothermic', label: 'Endothermic (heat in)' },
              ]}
              onChange={(v) => {
                switchMode(v as ThermicMode)
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
          <ControlSection title="Reading">
            <ControlStats>
              <ControlStat label="Temperature" value={`${tempReadout.toFixed(1)} °C`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
