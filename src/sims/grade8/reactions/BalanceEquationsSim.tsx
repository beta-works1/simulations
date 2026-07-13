import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlSlider,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { fontPx } from '../../shared/drawHelpers'
import { drawHint, drawHoverHalo, drawLabelPill, drawValueChip } from '../../shared/labels'
import { clamp } from '../../shared/math'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
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

type CoefHit = {
  id: string
  minus: { x: number; y: number; r: number }
  plus: { x: number; y: number; r: number }
}

type Layout = { coefHits: CoefHit[] }

function drawMoleculeGroup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  coef: number,
  color: string,
  atoms: Record<string, number>,
  fs: number,
  hoverId: string | null,
  molId: string,
  coefHits: CoefHit[],
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

  const coefY = y + r + fs + 6
  const btnR = Math.max(10, fs * 0.75)
  const minusX = x - 28
  const plusX = x + 28

  coefHits.push({
    id: molId,
    minus: { x: minusX, y: coefY, r: btnR },
    plus: { x: plusX, y: coefY, r: btnR },
  })

  const minusHover = hoverId === `${molId}-minus`
  const plusHover = hoverId === `${molId}-plus`
  drawHoverHalo(ctx, minusX, coefY, btnR + 4, minusHover)
  drawHoverHalo(ctx, plusX, coefY, btnR + 4, plusHover)

  ctx.beginPath()
  ctx.arc(minusX, coefY, btnR, 0, Math.PI * 2)
  ctx.fillStyle = minusHover ? '#d5dbdb' : '#ecf0f1'
  ctx.fill()
  ctx.strokeStyle = '#566573'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#1a252f'
  ctx.font = `700 ${fs + 2}px Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('−', minusX, coefY + 1)

  ctx.beginPath()
  ctx.arc(plusX, coefY, btnR, 0, Math.PI * 2)
  ctx.fillStyle = plusHover ? '#d5dbdb' : '#ecf0f1'
  ctx.fill()
  ctx.stroke()
  ctx.fillText('+', plusX, coefY + 1)

  drawValueChip(ctx, '', coef > 1 ? `${coef}${label}` : label, x, coefY - btnR - 8, {
    fontSize: Math.max(10, fs - 1),
  })
}

function drawSide(
  ctx: CanvasRenderingContext2D,
  molecules: EquationSpec['reactants'],
  coefficients: Record<string, number>,
  cx: number,
  cy: number,
  fs: number,
  gap: number,
  hoverId: string | null,
  coefHits: CoefHit[],
) {
  const n = molecules.length
  const startX = cx - ((n - 1) * gap) / 2
  molecules.forEach((m, i) => {
    drawMoleculeGroup(
      ctx,
      startX + i * gap,
      cy,
      m.label,
      coefficients[m.id] ?? 1,
      m.color,
      m.atoms,
      fs,
      hoverId,
      m.id,
      coefHits,
    )
  })
}

export function BalanceEquationsSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef({
    eqId: 'h2o',
    coefficients: defaultCoefficients(EQUATIONS[0]),
  })
  const layoutRef = useRef<Layout>({ coefHits: [] })
  const hoverRef = useRef<string | null>(null)
  const hintShown = useRef(true)
  const [eqId, setEqId] = useState('h2o')
  const [coefficients, setCoefficients] = useState<Record<string, number>>(() =>
    defaultCoefficients(EQUATIONS[0]),
  )
  const [version, setVersion] = useState(0)

  paramsRef.current = { eqId, coefficients }

  const eq = useMemo(() => EQUATIONS.find((e) => e.id === eqId) ?? EQUATIONS[0], [eqId])
  const balanced = isBalanced(eq, coefficients)
  const leftCounts = countAtoms(eq.reactants, coefficients)
  const rightCounts = countAtoms(eq.products, coefficients)
  const allMolecules = [...eq.reactants, ...eq.products]

  useEffect(() => {
    const id = window.setInterval(() => {
      setCoefficients({ ...paramsRef.current.coefficients })
    }, 120)
    return () => clearInterval(id)
  }, [])

  const adjustCoef = (molId: string, delta: number) => {
    hintShown.current = false
    const cur = paramsRef.current.coefficients[molId] ?? 1
    paramsRef.current.coefficients = {
      ...paramsRef.current.coefficients,
      [molId]: clamp(cur + delta, 1, 6),
    }
    setCoefficients({ ...paramsRef.current.coefficients })
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt) => {
      for (const h of layoutRef.current.coefHits) {
        if (Math.hypot(pt.x - h.minus.x, pt.y - h.minus.y) < h.minus.r + 6) return `${h.id}-minus`
        if (Math.hypot(pt.x - h.plus.x, pt.y - h.plus.y) < h.plus.r + 6) return `${h.id}-plus`
      }
      return null
    },
    onHoverChange: (id) => {
      hoverRef.current = id
    },
    onTap: (id) => {
      if (!id) return
      const [molId, action] = id.split('-')
      adjustCoef(molId, action === 'plus' ? 1 : -1)
    },
  })

  const selectEquation = (id: string) => {
    const next = EQUATIONS.find((e) => e.id === id) ?? EQUATIONS[0]
    const coefs = defaultCoefficients(next)
    paramsRef.current = { eqId: id, coefficients: coefs }
    setEqId(id)
    setCoefficients(coefs)
    setVersion((v) => v + 1)
  }

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const p = paramsRef.current
      const currentEq = EQUATIONS.find((e) => e.id === p.eqId) ?? EQUATIONS[0]
      const coefs = p.coefficients
      const isBal = isBalanced(currentEq, coefs)
      const left = countAtoms(currentEq.reactants, coefs)
      const right = countAtoms(currentEq.products, coefs)
      const hover = hoverRef.current
      const fs = fontPx(13, w, h)

      layoutRef.current.coefHits = []

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#f7f9fb')
      bg.addColorStop(1, '#e8eef4')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      drawLabelPill(ctx, 'Balance the chemical equation', w / 2, 28, { fontSize: fs + 2 })

      const cy = h * 0.42
      const gap = Math.min(w * 0.18, 120)
      drawSide(ctx, currentEq.reactants, coefs, w * 0.28, cy, fs, gap, hover, layoutRef.current.coefHits)

      ctx.fillStyle = '#1a252f'
      ctx.font = `700 ${fs + 10}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('→', w / 2, cy + 4)

      drawSide(ctx, currentEq.products, coefs, w * 0.72, cy, fs, gap, hover, layoutRef.current.coefHits)

      const statusText = isBal ? 'Balanced! Atoms conserved.' : 'Not balanced — adjust coefficients.'
      drawLabelPill(ctx, statusText, w / 2, h * 0.62 + fs + 10, {
        fontSize: fs,
        bg: isBal ? 'rgba(39,174,96,0.22)' : 'rgba(231,76,60,0.15)',
        fg: isBal ? '#1e8449' : '#922b21',
      })

      drawValueChip(ctx, 'Reactants', formatAtomCounts(left), w * 0.28, h * 0.78, { fontSize: fs })
      drawValueChip(ctx, 'Products', formatAtomCounts(right), w * 0.72, h * 0.78, { fontSize: fs })

      if (hintShown.current) {
        drawHint(ctx, 'click ± on canvas or use sliders', w / 2, h - 18, w, h)
      }
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
        const coefs = defaultCoefficients(eq)
        paramsRef.current.coefficients = coefs
        setCoefficients(coefs)
        hintShown.current = true
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
                onChange={(v) => {
                  paramsRef.current.coefficients = { ...paramsRef.current.coefficients, [m.id]: v }
                  setCoefficients((prev) => ({ ...prev, [m.id]: v }))
                }}
              />
            ))}
          </ControlSection>
          <ControlSection title="Atom counts">
            <ControlStats>
              <ControlStat label="Status" value={balanced ? 'Balanced ✓' : 'Unbalanced'} />
              <ControlStat label="Left side" value={formatAtomCounts(leftCounts)} />
              <ControlStat label="Right side" value={formatAtomCounts(rightCounts)} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
