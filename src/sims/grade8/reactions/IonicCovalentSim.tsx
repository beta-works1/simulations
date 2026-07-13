import { useCallback, useRef, useState } from 'react'
import { ControlHint, ControlSection, ControlSelect } from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  covalentShareOffset,
  createBondAnimState,
  ionicElectronPos,
  resetBondAnim,
  stepBondAnim,
  type BondMode,
} from './ionicCovalentModel'

const MODES: { id: BondMode; label: string }[] = [
  { id: 'ionic', label: 'Ionic (NaCl)' },
  { id: 'covalent-h2', label: 'Covalent (H₂)' },
  { id: 'covalent-h2o', label: 'Covalent (H₂O)' },
]

type BtnLayout = { id: BondMode; x: number; y: number; w: number; h: number }

type Layout = { buttons: BtnLayout[] }

function drawAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  charge: string | null,
  r: number,
  color: string,
  fs: number,
  hover: boolean,
) {
  drawHoverHalo(ctx, x, y, r + 6, hover)
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = hover ? '#2980b9' : '#1a252f'
  ctx.lineWidth = hover ? 3 : 2
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${fs + 4}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, y + 1)
  if (charge) {
    drawValueChip(ctx, '', charge, x, y + r + fs + 2, { fontSize: fs })
  }
}

function drawElectron(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, label: string) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#2980b9'
  ctx.fill()
  ctx.strokeStyle = '#1a5276'
  ctx.lineWidth = 1.5
  ctx.stroke()
  drawValueChip(ctx, '', label, x, y, { fontSize: Math.max(8, r), accent: true })
}

export function IonicCovalentSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(createBondAnimState())
  const paramsRef = useRef({ mode: 'ionic' as BondMode })
  const layoutRef = useRef<Layout>({ buttons: [] })
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<BondMode>('ionic')
  const [version, setVersion] = useState(0)

  paramsRef.current.mode = mode

  const setBondMode = (next: BondMode) => {
    hintShown.current = false
    paramsRef.current.mode = next
    setMode(next)
    animRef.current = resetBondAnim()
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      for (const b of layoutRef.current.buttons) {
        if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return `mode:${b.id}`
      }
      if (pt.y > 60 && pt.y < 280) return 'atoms'
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      hintShown.current = false
      if (id.startsWith('mode:')) {
        setBondMode(id.slice(5) as BondMode)
        return
      }
      if (id === 'atoms') {
        const idx = MODES.findIndex((m) => m.id === paramsRef.current.mode)
        setBondMode(MODES[(idx + 1) % MODES.length].id)
      }
    },
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) animRef.current = stepBondAnim(animRef.current, dt, running)
      const { phase, time } = animRef.current
      const currentMode = paramsRef.current.mode
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      layoutRef.current.buttons = []
      const btnY = h - 52
      const btnW = Math.min(130, (w - 40) / 3)
      const btnH = 32
      const gap = 8
      const totalW = MODES.length * btnW + (MODES.length - 1) * gap
      let bx = (w - totalW) / 2
      for (const m of MODES) {
        const active = currentMode === m.id
        const isHover = hover === `mode:${m.id}`
        layoutRef.current.buttons.push({ id: m.id, x: bx, y: btnY, w: btnW, h: btnH })
        drawHoverHalo(ctx, bx + btnW / 2, btnY + btnH / 2, btnW * 0.5, isHover && !active)
        drawLabelPill(ctx, m.label, bx + btnW / 2, btnY + btnH / 2, {
          fontSize: Math.max(9, fs - 2),
          bg: active ? 'rgba(41,128,185,0.25)' : isHover ? 'rgba(255,255,255,0.95)' : LABEL_BG,
          fg: active ? '#1a5276' : '#1a252f',
          bold: active,
        })
        bx += btnW + gap
      }

      const cx = w / 2
      const cy = h * 0.48
      const atomR = Math.min(w, h) * 0.09
      const eR = Math.max(6, fs * 0.45)
      const atomsHover = hover === 'atoms'

      if (currentMode === 'ionic') {
        const leftX = cx - w * 0.18
        const rightX = cx + w * 0.18
        const ionic = ionicElectronPos(phase)

        drawLabelPill(ctx, 'Ionic bond — electron transfer (NaCl)', cx, 28, { fontSize: fs + 2 })

        drawAtom(ctx, leftX, cy, 'Na', ionic.transferred ? 'Na⁺' : 'Na', atomR, '#e67e22', fs, atomsHover)
        drawAtom(ctx, rightX, cy, 'Cl', ionic.transferred ? 'Cl⁻' : 'Cl', atomR, '#27ae60', fs, atomsHover)

        const startX = leftX + atomR + 4
        const endX = rightX - atomR - 4
        const ex = startX + (endX - startX) * ionic.cl
        drawElectron(ctx, ex, cy - atomR * 0.6, eR, 'e⁻')

        if (ionic.transferred) {
          ctx.strokeStyle = '#8e44ad'
          ctx.lineWidth = 2
          ctx.setLineDash([6, 4])
          ctx.beginPath()
          ctx.moveTo(leftX + atomR, cy)
          ctx.lineTo(rightX - atomR, cy)
          ctx.stroke()
          ctx.setLineDash([])
        }

        drawValueChip(ctx, '', 'Metal loses e⁻ → cation', cx, h - 88, { fontSize: fs })
      } else if (currentMode === 'covalent-h2') {
        const offset = covalentShareOffset(phase, time)
        const leftX = cx - w * 0.1
        const rightX = cx + w * 0.1

        drawLabelPill(ctx, 'Covalent bond — H₂ shared electron pair', cx, 28, { fontSize: fs + 2 })

        drawAtom(ctx, leftX, cy, 'H', null, atomR * 0.85, '#3498db', fs, atomsHover)
        drawAtom(ctx, rightX, cy, 'H', null, atomR * 0.85, '#3498db', fs, atomsHover)

        const midX = (leftX + rightX) / 2
        drawElectron(ctx, midX - 10 + offset * 0.3, cy - 6, eR * 0.9, 'e⁻')
        drawElectron(ctx, midX + 10 - offset * 0.3, cy - 6, eR * 0.9, 'e⁻')

        ctx.strokeStyle = '#2980b9'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(leftX + atomR * 0.7, cy)
        ctx.lineTo(rightX - atomR * 0.7, cy)
        ctx.stroke()

        drawValueChip(ctx, '', 'Non-metals share electrons equally', cx, h - 88, { fontSize: fs })
      } else {
        const oX = cx
        const h1X = cx - w * 0.16
        const h2X = cx + w * 0.16
        const hY = cy + atomR * 0.9
        const offset = covalentShareOffset(phase, time)

        drawLabelPill(ctx, 'Covalent bond — H₂O shared pairs', cx, 28, { fontSize: fs + 2 })

        drawAtom(ctx, oX, cy, 'O', null, atomR, '#e74c3c', fs, atomsHover)
        drawAtom(ctx, h1X, hY, 'H', null, atomR * 0.75, '#3498db', fs, atomsHover)
        drawAtom(ctx, h2X, hY, 'H', null, atomR * 0.75, '#3498db', fs, atomsHover)

        drawElectron(ctx, (oX + h1X) / 2 - 6 + offset * 0.2, (cy + hY) / 2, eR * 0.85, 'e⁻')
        drawElectron(ctx, (oX + h1X) / 2 + 6 - offset * 0.2, (cy + hY) / 2, eR * 0.85, 'e⁻')
        drawElectron(ctx, (oX + h2X) / 2 - 6 - offset * 0.2, (cy + hY) / 2, eR * 0.85, 'e⁻')
        drawElectron(ctx, (oX + h2X) / 2 + 6 + offset * 0.2, (cy + hY) / 2, eR * 0.85, 'e⁻')

        ctx.strokeStyle = '#2980b9'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(oX - atomR * 0.5, cy + atomR * 0.4)
        ctx.lineTo(h1X, hY - atomR * 0.5)
        ctx.moveTo(oX + atomR * 0.5, cy + atomR * 0.4)
        ctx.lineTo(h2X, hY - atomR * 0.5)
        ctx.stroke()

        drawValueChip(ctx, '', 'O shares one pair with each H atom', cx, h - 88, { fontSize: fs })
      }

      if (hintShown.current) {
        drawHint(ctx, 'click mode buttons or atoms to switch', w / 2, h - 18, w, h)
      }
    },
    [mode, running],
  )

  useCanvasLoop(canvasRef, draw, running, version, true)

  return (
    <SimShell
      title="Ionic vs Covalent Bonds"
      subtitle="Electron transfer vs shared electron pairs"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        animRef.current = resetBondAnim()
        paramsRef.current.mode = 'ionic'
        setMode('ionic')
        setRunning(true)
        hintShown.current = true
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Bond type">
            <ControlHint>Play to animate electron movement or sharing.</ControlHint>
            <ControlSelect
              label="Mode"
              value={mode}
              options={[
                { value: 'ionic', label: 'Ionic (Na + Cl)' },
                { value: 'covalent-h2', label: 'Covalent (H₂)' },
                { value: 'covalent-h2o', label: 'Covalent (H₂O)' },
              ]}
              onChange={(v) => {
                setBondMode(v as BondMode)
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
        </>
      }
    />
  )
}

const LABEL_BG = 'rgba(255,255,255,0.92)'
