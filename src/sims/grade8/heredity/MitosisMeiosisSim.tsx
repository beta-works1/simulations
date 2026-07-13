import { useCallback, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

const MITOSIS = ['Prophase', 'Metaphase', 'Anaphase', 'Telophase', '2 identical cells']
const MEIOSIS = [
  'Prophase I',
  'Metaphase I',
  'Anaphase I',
  'Telophase I',
  'Meiosis II',
  '4 unique gametes',
]

export function MitosisMeiosisSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<'mitosis' | 'meiosis'>('mitosis')
  const stageRef = useRef(0)
  const accum = useRef(0)
  const [version, setVersion] = useState(0)
  const [stageLabel, setStageLabel] = useState(0)

  const stages = mode === 'mitosis' ? MITOSIS : MEIOSIS

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
    if (dt > 0 && running) {
      accum.current += dt
      if (accum.current > 1.4) {
        accum.current = 0
        stageRef.current = (stageRef.current + 1) % stages.length
        setStageLabel(stageRef.current)
      }
    }
    const stage = stageRef.current

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#f4fafc'
    ctx.fillRect(0, 0, w, h)

    const cx = w / 2
    const cy = h * 0.48
    const cellR = Math.min(w, h) * 0.28

    ctx.beginPath()
    ctx.arc(cx, cy, cellR, 0, Math.PI * 2)
    ctx.fillStyle = '#d6eaf8'
    ctx.fill()
    ctx.strokeStyle = '#5dade2'
    ctx.lineWidth = 4
    ctx.stroke()

    const nChrom = 4
    const progress = stage / Math.max(1, stages.length - 1)

    for (let i = 0; i < nChrom; i++) {
      const baseAngle = (i / nChrom) * Math.PI * 2
      let x = cx
      let y = cy
      if (stage <= 1) {
        x = cx + Math.cos(baseAngle) * cellR * 0.35
        y = cy + Math.sin(baseAngle) * cellR * 0.35
      } else if (mode === 'mitosis' && stage === 2) {
        x = cx + ((i % 2 === 0 ? -1 : 1) * cellR * 0.45)
        y = cy + (i - 1.5) * 18
      } else if (mode === 'mitosis' && stage >= 3) {
        const side = i < 2 ? -1 : 1
        x = cx + side * cellR * (0.55 + progress * 0.1)
        y = cy + ((i % 2) - 0.5) * 30
      } else if (mode === 'meiosis') {
        if (stage <= 2) {
          x = cx + Math.cos(baseAngle) * cellR * (0.2 + stage * 0.1)
          y = cy + Math.sin(baseAngle) * cellR * (0.2 + stage * 0.1)
        } else {
          const qx = (i % 2 === 0 ? -1 : 1) * cellR * 0.55
          const qy = (i < 2 ? -1 : 1) * cellR * 0.45
          x = cx + qx
          y = cy + qy
        }
      }

      ctx.strokeStyle = i % 2 === 0 ? '#c0392b' : '#8e44ad'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(x - 10, y - 16)
      ctx.quadraticCurveTo(x, y, x + 10, y + 16)
      ctx.stroke()
      if (mode === 'mitosis' && stage < 2) {
        ctx.beginPath()
        ctx.moveTo(x + 6, y - 16)
        ctx.quadraticCurveTo(x + 14, y, x + 22, y + 16)
        ctx.stroke()
      }
    }

    if ((mode === 'mitosis' && stage >= 4) || (mode === 'meiosis' && stage >= 5)) {
      ctx.strokeStyle = '#85929e'
      ctx.lineWidth = 2
      if (mode === 'mitosis') {
        ctx.beginPath()
        ctx.moveTo(cx, cy - cellR)
        ctx.lineTo(cx, cy + cellR)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(cx, cy - cellR)
        ctx.lineTo(cx, cy + cellR)
        ctx.moveTo(cx - cellR, cy)
        ctx.lineTo(cx + cellR, cy)
        ctx.stroke()
      }
    }

    ctx.fillStyle = '#1a252f'
    ctx.font = '600 16px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${mode === 'mitosis' ? 'Mitosis' : 'Meiosis'} — ${stages[stage]}`, w / 2, 28)
    ctx.font = '12px Roboto, sans-serif'
    ctx.fillStyle = '#5d6d7e'
    ctx.fillText(
      mode === 'mitosis' ? 'Produces 2 identical diploid cells' : 'Produces 4 genetically unique haploid gametes',
      w / 2,
      h - 16,
    )
  }, [mode, running, stages])

  useCanvasLoop(canvasRef, draw, running, version)

  return (
    <SimShell
      title="Mitosis vs Meiosis"
      canvasRef={canvasRef}
      running={running}
      onTogglePlay={() => setRunning((r) => !r)}
      onReset={() => {
        stageRef.current = 0
        setStageLabel(0)
        accum.current = 0
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <p className="hint">Compare chromosome behavior and final cell count.</p>
          <label>
            Process
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as 'mitosis' | 'meiosis')
                stageRef.current = 0
                setStageLabel(0)
                accum.current = 0
                setVersion((v) => v + 1)
              }}
            >
              <option value="mitosis">Mitosis</option>
              <option value="meiosis">Meiosis</option>
            </select>
          </label>
          <div className="stat">
            <span>Stage</span>
            <strong>
              {stageLabel + 1}/{stages.length}
            </strong>
          </div>
        </>
      }
    />
  )
}
