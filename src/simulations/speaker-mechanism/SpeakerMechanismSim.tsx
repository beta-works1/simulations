import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../sims/shared/math'
import { useCanvasPointer } from '../../sims/shared/useCanvasPointer'
import { drawGlow, fillThemeBackground, SCENE, strokeWithGlow, withShadow } from '../shared/canvasTheme'
import { SimShell, SimTransport } from '../shared/SimShell'
import { useAnimationLoop } from '../shared/useAnimationLoop'
import { useCanvasSize } from '../shared/useCanvasSize'
import {
  advanceWaves,
  coilOffset,
  DEFAULT_SPEAKER_STATE,
  resetSpeaker,
  spawnWaves,
  type SoundWave,
  type SpeakerState,
} from './model'

export function SpeakerMechanismSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w, h } = useCanvasSize(canvasRef)
  const [state, setState] = useState<SpeakerState>(DEFAULT_SPEAKER_STATE)
  const timeRef = useRef(0)
  const wavesRef = useRef<SoundWave[]>([])
  const lastSpawnRef = useRef(0)

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      const cx = size.w * 0.38
      const cy = size.h * 0.52
      const housingR = Math.min(size.h * 0.28, 120)
      return Math.hypot(pt.x - cx, pt.y - cy) <= housingR + 24 ? 'speaker' : null
    },
    onDrag: (_id, pt, size) => {
      const cy = size.h * 0.52
      const housingR = Math.min(size.h * 0.28, 120)
      const current = clamp(Math.round((1 - (pt.y - (cy - housingR)) / (housingR * 2)) * 20) / 20, 0, 1)
      const frequency = clamp(Math.round((40 + (pt.x / Math.max(1, size.w)) * 360) / 10) * 10, 40, 400)
      setState((s) => ({ ...s, current, frequency }))
    },
  })

  useAnimationLoop(state.running, (dt) => {
    timeRef.current += dt
    if (state.current > 0) {
      const maxR = Math.min(w, h) * 0.45
      const spawned = spawnWaves(wavesRef.current, timeRef.current, lastSpawnRef.current, maxR)
      wavesRef.current = spawned.waves
      lastSpawnRef.current = spawned.lastSpawn
      wavesRef.current = advanceWaves(
        wavesRef.current,
        timeRef.current,
        80 + state.frequency * 0.15,
        dt,
      )
    }
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    fillThemeBackground(ctx, w, h, 'electric')

    const cx = w * 0.38
    const cy = h * 0.52
    const time = timeRef.current
    const offset = state.running ? coilOffset(state.current, state.frequency, time) : 0

    // Speaker housing
    const housingR = Math.min(h * 0.28, 120)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, housingR, 0, Math.PI * 2)
    ctx.stroke()

    // Diaphragm (cone)
    ctx.fillStyle = '#334155'
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - housingR * 0.55, cy)
    ctx.quadraticCurveTo(cx + offset * 0.3, cy + offset, cx + housingR * 0.75, cy)
    ctx.quadraticCurveTo(cx + offset * 0.3, cy - offset, cx - housingR * 0.55, cy)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Electromagnet coil behind diaphragm
    const coilX = cx - housingR * 0.15
    const coilActive = state.current > 0
    if (coilActive) {
      drawGlow(ctx, coilX, cy + offset * 0.5, 36, SCENE.electric.accent, 0.22)
    }
    withShadow(ctx, () => {
      const coilColor = coilActive ? SCENE.electric.accent : '#64748b'
      ctx.strokeStyle = coilColor
      ctx.lineWidth = coilActive ? 2.75 : 2.5
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.ellipse(coilX, cy + offset * 0.5, 10, 18 + i * 3, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }, { blur: 10, oy: 3 })

    // Permanent magnet core
    withShadow(ctx, () => {
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(coilX - 8, cy - 22 + offset * 0.3, 16, 18)
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(coilX - 8, cy + 4 + offset * 0.3, 16, 18)
    }, { blur: 12, oy: 4 })

    // Sound waves (concentric arcs to the right)
    const waveOriginX = cx + housingR * 0.75
    for (const wave of wavesRef.current) {
      const age = time - wave.birth
      const alpha = Math.max(0, 1 - age / 2.5) * state.current * 0.6
      if (alpha > 0.02) {
        strokeWithGlow(
          ctx,
          () => {
            ctx.beginPath()
            ctx.arc(waveOriginX, cy, wave.radius, -Math.PI / 3, Math.PI / 3)
          },
          `rgba(56, 189, 248, ${alpha})`,
          2,
          `rgba(56, 189, 248, ${alpha * 0.4})`,
        )
      }
    }

    // AC waveform indicator
    if (state.running && state.current > 0) {
      const graphY = h - 50
      const graphW = w - 40
      const graphX = 20
      strokeWithGlow(
        ctx,
        () => {
          ctx.beginPath()
          for (let x = 0; x <= graphW; x++) {
            const t = time + x / graphW * 0.5
            const y = graphY + Math.sin(2 * Math.PI * state.frequency * t) * 12 * state.current
            if (x === 0) ctx.moveTo(graphX + x, y)
            else ctx.lineTo(graphX + x, y)
          }
        },
        SCENE.electric.accent,
        1.5,
        SCENE.electric.glow,
      )
      ctx.fillStyle = '#64748b'
      ctx.font = '10px Roboto, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('AC current', graphX, graphY + 28)
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '12px Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Speaker — AC current vibrates diaphragm → sound waves', 16, 24)
  }, [w, h, state])

  useEffect(() => {
    draw()
    if (!state.running) return
    let raf = 0
    const tick = () => {
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draw, state.running])

  const reset = () => {
    setState(resetSpeaker())
    timeRef.current = 0
    wavesRef.current = []
    lastSpawnRef.current = 0
  }

  return (
    <SimShell
      title="Speaker Mechanism"
      subtitle="Alternating current vibrates the diaphragm and sends out sound waves."
      canvasRef={canvasRef}
      sidebar={
        <>
          <h3>Speaker</h3>
          <p className="sim-hint">
            Alternating current (AC) makes the electromagnet push and pull the diaphragm, sending out
            sound waves.
          </p>
          <div className="sim-slider-row">
            <label>
              <span>Current (A)</span>
              <span>{state.current.toFixed(2)} A</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.current}
              onChange={(e) => setState((s) => ({ ...s, current: Number(e.target.value) }))}
            />
          </div>
          <div className="sim-slider-row">
            <label>
              <span>Frequency (Hz)</span>
              <span>{state.frequency} Hz</span>
            </label>
            <input
              type="range"
              min={40}
              max={400}
              step={10}
              value={state.frequency}
              onChange={(e) => setState((s) => ({ ...s, frequency: Number(e.target.value) }))}
            />
          </div>
          <p className="sim-readout">
            <strong>Higher frequency</strong> → faster vibration, shorter wavelength
            <br />
            <strong>Higher current</strong> → louder (bigger diaphragm movement)
          </p>
        </>
      }
      toolbar={
        <SimTransport
          running={state.running}
          onToggle={() => setState((s) => ({ ...s, running: !s.running }))}
          onReset={reset}
        />
      }
    />
  )
}
