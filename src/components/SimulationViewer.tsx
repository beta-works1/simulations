import { Suspense } from 'react'
import type { Simulation } from '../data/simulations'
import { gradeLabel } from '../data/simulations'
import { getLazySim, hasInteractiveSim } from '../sims/registry'
import { SceneryEmbedViewer } from './SceneryEmbedViewer'
import { ViewerSkeleton } from './Skeleton'
import './SimulationViewer.css'

interface SimulationViewerProps {
  sim: Simulation
}

function Placeholder({ sim }: { sim: Simulation }) {
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

export function SimulationViewer({ sim }: SimulationViewerProps) {
  if (sim.sceneryHtml) {
    return (
      <div className="simulation-viewer-stage simulation-viewer-live simulation-viewer-scenery">
        <SceneryEmbedViewer src={sim.sceneryHtml} title={sim.title} />
      </div>
    )
  }

  const Interactive = hasInteractiveSim(sim.id) ? getLazySim(sim.id) : null

  if (!Interactive) {
    return <Placeholder sim={sim} />
  }

  return (
    <div className="simulation-viewer-stage simulation-viewer-live">
      <Suspense fallback={<ViewerSkeleton />}>
        <Interactive />
      </Suspense>
    </div>
  )
}
