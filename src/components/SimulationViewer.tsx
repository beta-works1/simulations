import { useEffect, useState } from 'react'
import type { Simulation } from '../data/simulations'
import { SUBJECT_ICONS, SUBJECT_LABELS } from '../data/simulations'
import { ViewerSkeleton } from './Skeleton'
import './SimulationViewer.css'

interface SimulationViewerProps {
  sim: Simulation
}

/**
 * Placeholder host for future canvas/WebGL sims.
 * Lazy-loaded from the detail page so the browse grid stays light.
 */
export function SimulationViewer({ sim }: SimulationViewerProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      if (now - start >= 450) {
        setReady(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sim.id])

  if (!ready) {
    return <ViewerSkeleton />
  }

  return (
    <div
      className="simulation-viewer-stage"
      style={{
        background: `linear-gradient(145deg, ${sim.color} 0%, ${sim.accent} 100%)`,
      }}
      role="img"
      aria-label={`${sim.title} simulation preview`}
    >
      <div className="viewer-content">
        <span className="viewer-icon" aria-hidden="true">
          {SUBJECT_ICONS[sim.subject]}
        </span>
        <p className="viewer-title">{sim.title}</p>
        <p className="viewer-note">
          Interactive {SUBJECT_LABELS[sim.subject].toLowerCase()} simulation will load here.
          Content coming soon.
        </p>
      </div>
    </div>
  )
}
