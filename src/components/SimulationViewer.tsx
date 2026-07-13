import type { Simulation } from '../data/simulations'
import { gradeLabel } from '../data/simulations'
import { ViewerSkeleton } from './Skeleton'
import { useEffect, useState } from 'react'
import './SimulationViewer.css'

interface SimulationViewerProps {
  sim: Simulation
}

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
          🔬
        </span>
        <p className="viewer-title">{sim.title}</p>
        <p className="viewer-note">
          Interactive {gradeLabel(sim.grade)} science experiment will load here. Content coming
          soon.
        </p>
      </div>
    </div>
  )
}
