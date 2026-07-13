import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx, roundRect } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import {
  countAtoms,
  defaultCoefficients,
  EQUATIONS,
  formatAtomCounts,
  formatEquation,
  isBalanced,
  type EquationSpec,
} from './balanceEquationsModel'

const ATOM_COLORS: Record<string, string> = {
  H: '#3498db',
  O: '#e74c3c',
  N: '#2980b9',
  Fe: '#7f8c8d',
  C: '#2c3e50',
}

function drawMoleculeGroup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  coef: number,
  color: string,
  atoms: Record<string, number>,
  fs: number,
) {
  const atomKeys = Object.keys(atoms)
  const r = Math.max(14, fs * 1.1)
  const spacing = r * 2.2
  const totalW = atomKeys.length * spacing
  let cx = x - totalW / 2 + spacing / 2

  for (const atom of atomKeys) {
    ctx.beginPath()
    ctx.arc(cx, y, r, 0, Math.PI * 2)
    ctx.fillStyle = ATOM_COLORS[atom] ?? color
    ctx.fill()
    ctx.strokeStyle = '#1a252f'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${fs}px Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(atom, cx, y + 1)
    cx += spacing
  }

  ctx.fillStyle = '#1a252f'
  ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
  ctx.fillText(coef > 1 ? `${coef}${label}` : label, x, y + r + fs + 6)
}

function drawSide(
  ctx: CanvasRenderingContext2D,
  molecules: EquationSpec['reactants'],
  coefficients: Record<string, number>,
  cx: number,
  cy: number,
  fs: number,
  gap: number,
) {
  const n = molecules.length
  const startX = cx - ((n - 1) * gap) / 2
  molecules.forEach((m, i) => {
    drawMoleculeGroup(ctx, startX + i * gap, cy, m.label, coefficients[m.id] ?? 1, m.color, m.atoms, fs)
  })
}

export function BalanceEquationsSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [eqId, setEqId] = useState('h2o')
  const [coefficients, setCoefficients] = useState<Record<string, number>>(() =>
    defaultCoefficients(EQUATIONS[0]),
  )
  const [version, setVersion] = useState(0)

  const eq = useMemo(() => EQUATIONS.find((e) => e.id === eqId) ?? EQUATIONS[0], [eqId])
  const balanced = isBalanced(eq, coefficients)
  const leftCounts = countAtoms(eq.reactants, coefficients)
  const rightCounts = countAtoms(eq.products, coefficients)

  const allMolecules = [...eq.reactants, ...eq.products]

  const setCoef = (id: string, value: number) => {
    setCoefficients((prev) => ({ ...prev, [id]: value }))
    setVersion((v) => v + 1)
  }

  const selectEquation = (id: string) => {
    const next = EQUATIONS.find((e) => e.id === id) ?? EQUATIONS[0]
    setEqId(id)
    setCoefficients(defaultCoefficients(next))
    setVersion((v) => v + 1)
  }

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const fs = fontPx(13, w, h)
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs + 2}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Balance the chemical equation', w / 2, 28)

      const cy = h * 0.42
      const gap = Math.min(w * 0.18, 120)
      drawSide(ctx, eq.reactants, coefficients, w * 0.28, cy, fs, gap)

      ctx.fillStyle = '#1a252f'
      ctx.font = `700 ${fs + 10}px Roboto, sans-serif`
      ctx.fillText('→', w / 2, cy + 4)

      drawSide(ctx, eq.products, coefficients, w * 0.72, cy, fs, gap)

      roundRect(ctx, w * 0.08, h * 0.62, w * 0.84, h * 0.28, 10)
      ctx.fillStyle = balanced ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.12)'
      ctx.fill()
      ctx.strokeStyle = balanced ? '#27ae60' : '#e74c3c'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = balanced ? '#1e8449' : '#922b21'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(balanced ? 'Balanced! Atoms conserved.' : 'Not balanced — adjust coefficients.', w * 0.08 + 14, h * 0.62 + fs + 10)
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillStyle = '#1a252f'
      ctx.fillText(`Reactants: ${formatAtomCounts(leftCounts)}`, w * 0.08 + 14, h * 0.62 + fs * 2 + 18)
      ctx.fillText(`Products:  ${formatAtomCounts(rightCounts)}`, w * 0.08 + 14, h * 0.62 + fs * 3 + 22)
    },
    [balanced, coefficients, eq, leftCounts, rightCounts],
  )

  useCanvasLoop(canvasRef, draw, false, version, true)

  return (
    <SimShell
      title="Balancing Equations"
      subtitle="Adjust coefficients until atom counts match on both sides"
      canvasRef={canvasRef}
      running={false}
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        setCoefficients(defaultCoefficients(eq))
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Equation">
            <ControlSelect
              label="Choose reaction"
              value={eqId}
              options={EQUATIONS.map((e) => ({ value: e.id, label: e.label }))}
              onChange={selectEquation}
            />
            <ControlHint>{formatEquation(eq, coefficients)}</ControlHint>
          </ControlSection>
          <ControlSection title="Coefficients">
            {allMolecules.map((m) => (
              <ControlSlider
                key={m.id}
                label={m.label}
                value={coefficients[m.id] ?? 1}
                min={1}
                max={6}
                step={1}
                onChange={(v) => setCoef(m.id, v)}
              />
            ))}
          </ControlSection>
          <ControlSection title="Atom counts">
            <ControlStats>
              <ControlStat
                label="Status"
                value={balanced ? 'Balanced ✓' : 'Unbalanced'}
              />
              <ControlStat label="Left side" value={formatAtomCounts(leftCounts)} />
              <ControlStat label="Right side" value={formatAtomCounts(rightCounts)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
