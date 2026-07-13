import { useCallback, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  covalentShareOffset,
  createBondAnimState,
  ionicElectronPos,
  resetBondAnim,
  stepBondAnim,
  type BondMode,
} from './ionicCovalentModel'

function drawAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  charge: string | null,
  r: number,
  color: string,
  fs: number,
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#1a252f'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${fs + 4}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, y + 1)
  if (charge) {
    ctx.fillStyle = '#1a252f'
    ctx.font = `600 ${fs}px Roboto, sans-serif`
    ctx.fillText(charge, x, y + r + fs + 2)
  }
}

function drawElectron(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#2980b9'
  ctx.fill()
  ctx.strokeStyle = '#1a5276'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `${Math.max(8, r)}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('e⁻', x, y + 1)
}

export function IonicCovalentSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(createBondAnimState())
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<BondMode>('ionic')
  const [version, setVersion] = useState(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      if (dt > 0) animRef.current = stepBondAnim(animRef.current, dt, running)
      const { phase, time } = animRef.current
      const fs = fontPx(13, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h * 0.48
      const atomR = Math.min(w, h) * 0.09
      const eR = Math.max(6, fs * 0.45)

      if (mode === 'ionic') {
        const leftX = cx - w * 0.18
        const rightX = cx + w * 0.18
        const ionic = ionicElectronPos(phase)

        ctx.fillStyle = '#1a252f'
        ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Ionic bond — electron transfer (NaCl)', cx, 28)

        drawAtom(ctx, leftX, cy, 'Na', ionic.transferred ? 'Na⁺' : 'Na', atomR, '#e67e22', fs)
        drawAtom(ctx, rightX, cy, 'Cl', ionic.transferred ? 'Cl⁻' : 'Cl', atomR, '#27ae60', fs)

        const startX = leftX + atomR + 4
        const endX = rightX - atomR - 4
        const ex = startX + (endX - startX) * ionic.cl
        drawElectron(ctx, ex, cy - atomR * 0.6, eR)

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

        ctx.fillStyle = '#5d6d7e'
        ctx.font = `${fs}px Roboto, sans-serif`
        ctx.fillText('Metal loses e⁻ → cation · Non-metal gains e⁻ → anion', cx, h - 24)
      } else if (mode === 'covalent-h2') {
        const offset = covalentShareOffset(phase, time)
        const leftX = cx - w * 0.1
        const rightX = cx + w * 0.1

        ctx.fillStyle = '#1a252f'
        ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Covalent bond — H₂ shared electron pair', cx, 28)

        drawAtom(ctx, leftX, cy, 'H', null, atomR * 0.85, '#3498db', fs)
        drawAtom(ctx, rightX, cy, 'H', null, atomR * 0.85, '#3498db', fs)

        const midX = (leftX + rightX) / 2
        drawElectron(ctx, midX - 10 + offset * 0.3, cy - 6, eR * 0.9)
        drawElectron(ctx, midX + 10 - offset * 0.3, cy - 6, eR * 0.9)

        ctx.strokeStyle = '#2980b9'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(leftX + atomR * 0.7, cy)
        ctx.lineTo(rightX - atomR * 0.7, cy)
        ctx.stroke()

        ctx.fillStyle = '#5d6d7e'
        ctx.font = `${fs}px Roboto, sans-serif`
        ctx.fillText('Non-metals share electrons equally', cx, h - 24)
      } else {
        const oX = cx
        const h1X = cx - w * 0.16
        const h2X = cx + w * 0.16
        const hY = cy + atomR * 0.9
        const offset = covalentShareOffset(phase, time)

        ctx.fillStyle = '#1a252f'
        ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Covalent bond — H₂O shared pairs', cx, 28)

        drawAtom(ctx, oX, cy, 'O', null, atomR, '#e74c3c', fs)
        drawAtom(ctx, h1X, hY, 'H', null, atomR * 0.75, '#3498db', fs)
        drawAtom(ctx, h2X, hY, 'H', null, atomR * 0.75, '#3498db', fs)

        drawElectron(ctx, (oX + h1X) / 2 - 6 + offset * 0.2, (cy + hY) / 2, eR * 0.85)
        drawElectron(ctx, (oX + h1X) / 2 + 6 - offset * 0.2, (cy + hY) / 2, eR * 0.85)
        drawElectron(ctx, (oX + h2X) / 2 - 6 - offset * 0.2, (cy + hY) / 2, eR * 0.85)
        drawElectron(ctx, (oX + h2X) / 2 + 6 + offset * 0.2, (cy + hY) / 2, eR * 0.85)

        ctx.strokeStyle = '#2980b9'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(oX - atomR * 0.5, cy + atomR * 0.4)
        ctx.lineTo(h1X, hY - atomR * 0.5)
        ctx.moveTo(oX + atomR * 0.5, cy + atomR * 0.4)
        ctx.lineTo(h2X, hY - atomR * 0.5)
        ctx.stroke()

        ctx.fillStyle = '#5d6d7e'
        ctx.font = `${fs}px Roboto, sans-serif`
        ctx.fillText('O shares one pair with each H atom', cx, h - 24)
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
        setMode('ionic')
        setRunning(true)
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
                setMode(v as BondMode)
                animRef.current = resetBondAnim()
                setVersion((n) => n + 1)
              }}
            />
          </ControlSection>
        </>
      }
    />
  )
}
