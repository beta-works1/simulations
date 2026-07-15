import { useCallback, useRef, useState } from 'react'
import { drawGlow, drawStarfield, fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import { drawCaptionCard } from '../shared/drawUtils'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useCanvasSize } from '../shared/useCanvasSize'
import { useRefPaintLoop } from '../shared/useRefPaintLoop'
import {
  createInitialState,
  currentStage,
  scrubToStage,
  setMass,
  stagesForMass,
  stepStarLifeCycle,
  type StarLifeCycleState,
  type StarStageId,
} from './model'

function drawStageVisual(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  stageId: StarStageId,
  progress: number,
  mass: 'low' | 'high',
) {
  const t = progress

  switch (stageId) {
    case 'nebula': {
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2
        const dist = 30 + (i % 7) * 8 + t * 12
        const px = cx + Math.cos(angle) * dist
        const py = cy + Math.sin(angle) * dist * 0.6
        const g = ctx.createRadialGradient(px, py, 0, px, py, 18 + (i % 5) * 4)
        g.addColorStop(0, `rgba(${120 + (i % 3) * 40},${80 + (i % 4) * 30},200,0.5)`)
        g.addColorStop(1, 'rgba(30,20,80,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, 18 + (i % 5) * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'protostar': {
      const r = 18 + t * 22
      drawGlow(ctx, cx, cy, r + 35, '#ffb347', 0.3 + t * 0.2)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 30)
      g.addColorStop(0, '#fff5e1')
      g.addColorStop(0.3, '#ffb347')
      g.addColorStop(0.7, 'rgba(255,100,50,0.3)')
      g.addColorStop(1, 'rgba(255,80,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, r + 30, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'main-sequence': {
      const r = mass === 'low' ? 28 : 42
      drawGlow(ctx, cx, cy, r + 28, SCENE.space.hot, 0.35)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 20)
      g.addColorStop(0, '#fffef0')
      g.addColorStop(0.25, '#ffeb3b')
      g.addColorStop(0.6, '#ff9800')
      g.addColorStop(1, 'rgba(255,120,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, r + 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff9c4'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'red-giant': {
      const r = (mass === 'low' ? 55 : 75) + Math.sin(t * Math.PI) * 8
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 35)
      g.addColorStop(0, '#ffcdd2')
      g.addColorStop(0.35, '#ef5350')
      g.addColorStop(0.7, '#b71c1c')
      g.addColorStop(1, 'rgba(120,20,20,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, r + 35, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'white-dwarf': {
      const r = 12
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 8)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.5, '#b3e5fc')
      g.addColorStop(1, 'rgba(100,180,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'supernova': {
      const r = 20 + t * 120
      drawGlow(ctx, cx, cy, r * 0.85, '#fff176', 0.4 - t * 0.15)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.15, '#fff176')
      g.addColorStop(0.4, '#ff7043')
      g.addColorStop(0.7, 'rgba(180,50,255,0.4)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 2
        strokeWithGlow(
          ctx,
          () => {
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9)
          },
          `rgba(255,220,100,${0.6 - t * 0.4})`,
          2,
          SCENE.space.hot,
        )
      }
      break
    }
    case 'neutron-star': {
      const r = 8
      ctx.fillStyle = '#e0f7fa'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 4; i++) {
        strokeWithGlow(
          ctx,
          () => {
            ctx.beginPath()
            ctx.ellipse(cx, cy, r + 20 + i * 8, 4, (i * Math.PI) / 4 + t * 4, 0, Math.PI * 2)
          },
          'rgba(100,220,255,0.5)',
          1.5,
          SCENE.space.glow,
        )
      }
      break
    }
    case 'black-hole': {
      const r = 22
      const diskR = 70 + Math.sin(t * 3) * 4
      drawGlow(ctx, cx, cy, diskR * 0.85, SCENE.space.hot, 0.22)
      const disk = ctx.createRadialGradient(cx, cy, r, cx, cy, diskR)
      disk.addColorStop(0, 'rgba(255,180,80,0)')
      disk.addColorStop(0.35, 'rgba(255,140,60,0.55)')
      disk.addColorStop(0.65, 'rgba(180,80,255,0.35)')
      disk.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = disk
      ctx.beginPath()
      ctx.ellipse(cx, cy, diskR, diskR * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      strokeWithGlow(
        ctx,
        () => {
          ctx.beginPath()
          ctx.arc(cx, cy, r + 2, 0, Math.PI * 2)
        },
        'rgba(255,200,120,0.6)',
        2,
        SCENE.space.hot,
      )
      break
    }
  }
}

function drawStarLifeCycle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: StarLifeCycleState,
) {
  fillThemeBackground(ctx, w, h, 'space')
  drawStarfield(ctx, w, h, 91, 80)

  const stage = currentStage(state)
  drawStageVisual(ctx, w * 0.5, h * 0.42, stage.id, state.stageProgress, state.mass)
  drawCaptionCard(ctx, w, h, stage.label, stage.description)
}

export function StarLifeCycleSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const stateRef = useRef<StarLifeCycleState>(createInitialState())
  const [running, setRunning] = useState(true)
  const [mass, setMassUi] = useState(createInitialState().mass)
  const [stageIndex, setStageIndex] = useState(0)
  const stages = stagesForMass(mass)
  const stage = stages[Math.min(stageIndex, stages.length - 1)] ?? stages[0]

  useRefPaintLoop({
    canvasRef,
    width: w,
    height: h,
    stateRef,
    running,
    step: (s, dt) => stepStarLifeCycle({ ...s, running: true }, dt),
    draw: drawStarLifeCycle,
    onSync: (s) => {
      setMassUi(s.mass)
      setStageIndex(s.stageIndex)
    },
  })

  const reset = useCallback(() => {
    stateRef.current = createInitialState()
    setMassUi(createInitialState().mass)
    setStageIndex(0)
    setRunning(true)
  }, [])

  return (
    <SimShell
      title="Star Life Cycle"
      subtitle="A star's fate depends on its mass."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Star Life Cycle</h3>
          <p className="sim-hint">
            A star&apos;s fate depends on its mass. Play to watch stages advance, or scrub the
            timeline.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Mass</span>
            </label>
            <select
              className="sim-select"
              value={mass}
              onChange={(e) => {
                const next = setMass(stateRef.current, e.target.value as 'low' | 'high')
                stateRef.current = next
                setMassUi(next.mass)
                setStageIndex(next.stageIndex)
              }}
            >
              <option value="low">Low mass (like the Sun)</option>
              <option value="high">High mass (supernova path)</option>
            </select>
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Stage</span>
              <span>{stage.label}</span>
            </label>
            <input
              type="range"
              min={0}
              max={stages.length - 1}
              step={1}
              value={stageIndex}
              onChange={(e) => {
                const next = scrubToStage(stateRef.current, Number(e.target.value))
                stateRef.current = next
                setStageIndex(next.stageIndex)
              }}
            />
          </div>
          <p className="sim-readout">
            {stageIndex + 1} / {stages.length}: {stage.description}
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={running}
          onToggle={() => setRunning((r) => !r)}
          onReset={reset}
        />
      }
    />
  )
}
