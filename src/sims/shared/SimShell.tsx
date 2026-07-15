import type { ReactNode, RefObject } from 'react'
import './SimShell.css'

interface SimShellProps {
  title: string
  subtitle?: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  running: boolean
  onTogglePlay: () => void
  onReset: () => void
  /** Preferred sidebar slot (Grade 8 / new sims). */
  controls?: ReactNode
  /** Alias for `controls` (topic-sim API). */
  sidebar?: ReactNode
  /** Optional bottom transport bar (topic-sim API). */
  toolbar?: ReactNode
  hidePlay?: boolean
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerLeave?: (e: React.PointerEvent<HTMLCanvasElement>) => void
}

export function SimShell({
  title,
  subtitle,
  canvasRef,
  running,
  onTogglePlay,
  onReset,
  controls,
  sidebar,
  toolbar,
  hidePlay = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: SimShellProps) {
  const panel = controls ?? sidebar
  return (
    <div className="sim-shell" role="region" aria-label={`${title} simulation`}>
      <header className="sim-shell-toolbar">
        <div className="sim-shell-heading">
          <h2 className="sim-shell-title">{title}</h2>
          {subtitle ? <p className="sim-shell-subtitle">{subtitle}</p> : null}
        </div>

        <div className="sim-shell-actions">
          {!hidePlay && (
            <button
              type="button"
              className={`sim-shell-icon-btn sim-shell-play ${running ? 'is-running' : ''}`}
              onClick={onTogglePlay}
              aria-label={running ? 'Pause simulation' : 'Play simulation'}
              title={running ? 'Pause' : 'Play'}
            >
              {running ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              <span>{running ? 'Pause' : 'Play'}</span>
            </button>
          )}
          <button
            type="button"
            className="sim-shell-icon-btn sim-shell-reset"
            onClick={onReset}
            aria-label="Reset simulation"
            title="Reset"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 5V2L8 6l4 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"
                fill="currentColor"
              />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </header>

      <div className={`sim-shell-body ${panel ? 'has-controls' : ''}`}>
        <div className="sim-shell-canvas-wrap">
          <canvas
            ref={canvasRef}
            aria-label={`${title} canvas`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
          />
        </div>
        {panel ? (
          <aside className="sim-shell-controls" aria-label="Simulation controls">
            {panel}
          </aside>
        ) : null}
      </div>
      {toolbar ? <div className="sim-shell-extra-toolbar">{toolbar}</div> : null}
    </div>
  )
}

/** Compact play/pause + reset (topic-sim transport). */
export function SimTransport({
  running,
  onToggle,
  onReset,
  extra,
}: {
  running: boolean
  onToggle: () => void
  onReset: () => void
  extra?: ReactNode
}) {
  return (
    <>
      <button type="button" className={`sim-shell-btn${running ? ' is-active' : ''}`} onClick={onToggle}>
        {running ? 'Pause' : 'Play'}
      </button>
      <button type="button" className="sim-shell-btn" onClick={onReset}>
        Reset
      </button>
      {extra}
    </>
  )
}
