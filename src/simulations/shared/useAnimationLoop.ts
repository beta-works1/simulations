import { useEffect, useRef } from 'react'

/** Drives a Canvas animation loop while `running` is true. */
export function useAnimationLoop(running: boolean, onFrame: (dtSeconds: number) => void) {
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const raw = (now - last) / 1000
      last = now
      const dt = Math.min(raw, 0.05)
      onFrameRef.current(dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])
}
