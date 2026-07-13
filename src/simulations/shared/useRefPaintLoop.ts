import { useEffect, useRef } from 'react'

/**
 * Paint-driven animation: mutates `stateRef` via `step`, draws each frame.
 * Avoids React setState-on-every-RAF jank. Optionally sync UI readouts via `onSync`.
 */
export function useRefPaintLoop<T>(opts: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  width: number
  height: number
  stateRef: React.MutableRefObject<T>
  running: boolean
  step: (state: T, dt: number) => T
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, state: T) => void
  /** Called ~8×/sec for sidebar readouts — keep light. */
  onSync?: (state: T) => void
  syncMs?: number
}) {
  const { canvasRef, width, height, stateRef, running, step, draw, onSync, syncMs = 120 } = opts
  const stepRef = useRef(step)
  const drawRef = useRef(draw)
  const syncRef = useRef(onSync)
  stepRef.current = step
  drawRef.current = draw
  syncRef.current = onSync

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width < 2 || height < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let lastSync = 0
    let disposed = false

    const paint = (dt: number) => {
      if (dt > 0 && running) {
        stateRef.current = stepRef.current(stateRef.current, dt)
      }
      drawRef.current(ctx, width, height, stateRef.current)
      const now = performance.now()
      if (syncRef.current && now - lastSync > syncMs) {
        lastSync = now
        syncRef.current(stateRef.current)
      }
    }

    const tick = (now: number) => {
      if (disposed) return
      const dt = running ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      paint(dt)
      raf = requestAnimationFrame(tick)
    }

    paint(0)
    last = performance.now()
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [canvasRef, width, height, running, stateRef, syncMs])
}
