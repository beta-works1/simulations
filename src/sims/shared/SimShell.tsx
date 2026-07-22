import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { playClick, isSoundMuted, subscribeSoundMuted, toggleSoundMuted } from './sound'
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
  /** Hide the header Reset button (e.g. when Reset lives only in the side panel). */
  hideReset?: boolean
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
  hideReset = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: SimShellProps) {
  const panel = controls ?? sidebar
  const [muted, setMuted] = useState(() => isSoundMuted())

  useEffect(() => subscribeSoundMuted(setMuted), [])

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
              onClick={() => {
                playClick()
                onTogglePlay()
              }}
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
          {!hideReset && (
            <button
              type="button"
              className="sim-shell-icon-btn sim-shell-reset"
              onClick={() => {
                playClick()
                onReset()
              }}
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
          )}
          <button
            type="button"
            className={`sim-shell-icon-btn sim-shell-mute${muted ? ' is-muted' : ''}`}
            onClick={() => {
              const next = toggleSoundMuted()
              // Brief click only when unmuting so mute itself stays silent
              if (!next) playClick()
            }}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={muted}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63z" />
                <path d="M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" />
                <path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
            <span className="sim-shell-mute-label">{muted ? 'Muted' : 'Sound'}</span>
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
      <button
        type="button"
        className={`sim-shell-btn${running ? ' is-active' : ''}`}
        onClick={() => {
          playClick()
          onToggle()
        }}
      >
        {running ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className="sim-shell-btn"
        onClick={() => {
          playClick()
          onReset()
        }}
      >
        Reset
      </button>
      {extra}
    </>
  )
}
