import { useEffect, useRef } from 'react'

/** Canvas draw callback: ctx is already scaled to CSS pixel size. */
export type CanvasDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dt: number,
) => void

/**
 * Fits a canvas to its parent with devicePixelRatio, and runs an animation loop
 * while `running` is true (also draws one frame when paused so the view stays current).
 */
export function useCanvasLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: CanvasDrawFn,
  running: boolean,
  redrawKey = 0,
) {
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let last = performance.now()
    let disposed = false

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        drawRef.current(ctx, w, h, 0)
      }
    }

    const tick = (now: number) => {
      if (disposed) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ctx = canvas.getContext('2d')
      const parent = canvas.parentElement
      if (ctx && parent) {
        drawRef.current(ctx, parent.clientWidth, parent.clientHeight, dt)
      }
      if (running) raf = requestAnimationFrame(tick)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    if (running) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [canvasRef, running, redrawKey])
}
