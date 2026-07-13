import type { ReactNode, RefObject } from 'react'
import './SimShell.css'

interface SimShellProps {
  title?: string
  subtitle?: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  sidebar: ReactNode
  toolbar?: ReactNode
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerLeave?: (e: React.PointerEvent<HTMLCanvasElement>) => void
}

export function SimShell({
  title,
  subtitle,
  canvasRef,
  sidebar,
  toolbar,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: SimShellProps) {
  return (
    <div className="sim-shell" role="region" aria-label={title ? `${title} simulation` : 'Simulation'}>
      {title ? (
        <header className="sim-shell-header">
          <div>
            <h2 className="sim-shell-header-title">{title}</h2>
            {subtitle ? <p className="sim-shell-header-sub">{subtitle}</p> : null}
          </div>
        </header>
      ) : null}
      <div className="sim-shell-main">
        <div className="sim-shell-canvas-wrap">
          <canvas
            ref={canvasRef}
            aria-label={title ? `${title} canvas` : 'Simulation canvas'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
          />
        </div>
        <aside className="sim-shell-sidebar">{sidebar}</aside>
      </div>
      {toolbar ? <div className="sim-shell-toolbar">{toolbar}</div> : null}
    </div>
  )
}

interface TransportProps {
  running: boolean
  onToggle: () => void
  onReset: () => void
  extra?: ReactNode
}

export function SimTransport({ running, onToggle, onReset, extra }: TransportProps) {
  return (
    <>
      <button type="button" className={`sim-btn ${running ? 'is-active' : ''}`} onClick={onToggle}>
        {running ? 'Pause' : 'Play'}
      </button>
      <button type="button" className="sim-btn sim-btn-ghost" onClick={onReset}>
        Reset
      </button>
      {extra}
    </>
  )
}
