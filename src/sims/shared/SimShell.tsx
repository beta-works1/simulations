import type { ReactNode, RefObject } from 'react'
import './SimShell.css'

interface SimShellProps {
  title: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  running: boolean
  onTogglePlay: () => void
  onReset: () => void
  controls?: ReactNode
  hidePlay?: boolean
}

export function SimShell({
  title,
  canvasRef,
  running,
  onTogglePlay,
  onReset,
  controls,
  hidePlay = false,
}: SimShellProps) {
  return (
    <div className="sim-shell">
      <div className="sim-shell-toolbar">
        <span className="sim-shell-title">{title}</span>
        {!hidePlay && (
          <button
            type="button"
            className={`sim-shell-btn ${running ? '' : 'is-primary'}`}
            onClick={onTogglePlay}
          >
            {running ? 'Pause' : 'Play'}
          </button>
        )}
        <button type="button" className="sim-shell-btn" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="sim-shell-body">
        <div className="sim-shell-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
        {controls ? <aside className="sim-shell-controls">{controls}</aside> : null}
      </div>
    </div>
  )
}
