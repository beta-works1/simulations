import { lazy, Suspense, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { ViewerSkeleton } from '../components/Skeleton'
import { getSimulationById } from '../data/simulations'
import './SimulationRunPage.css'

const SimulationViewer = lazy(() =>
  import('../components/SimulationViewer').then((m) => ({ default: m.SimulationViewer })),
)

/**
 * PhET-style full-viewport launcher.
 * SceneryStack sims fill the window with their own bottom nav bar;
 * React sims get the same edge-to-edge black stage.
 */
export function SimulationRunPage() {
  const { id } = useParams<{ id: string }>()
  const sim = id ? getSimulationById(id) : undefined

  useEffect(() => {
    document.documentElement.classList.add('sim-run-active')
    document.body.classList.add('sim-run-active')
    return () => {
      document.documentElement.classList.remove('sim-run-active')
      document.body.classList.remove('sim-run-active')
    }
  }, [])

  // Prefer the standalone SceneryStack HTML — same look as PhET Color Vision.
  useEffect(() => {
    if (!sim?.sceneryHtml) return
    const target = sim.sceneryHtml
    // Replace this shell with the real PhET-style sim document.
    window.location.replace(target)
  }, [sim])

  if (!sim) {
    return (
      <div className="sim-run-page sim-run-missing">
        <PageMeta title="Simulation Not Found" description="Simulation not found." path="/simulations" />
        <h1>Simulation not found</h1>
        <Link to="/simulations" className="btn btn-primary">
          Browse simulations
        </Link>
      </div>
    )
  }

  // Scenery sims redirect above; show a brief loading frame meanwhile.
  if (sim.sceneryHtml) {
    return (
      <div className="sim-run-page sim-run-phet">
        <PageMeta title={sim.title} description={sim.description} path={`/run/${sim.id}`} />
        <div className="sim-run-loading" role="status">
          Opening {sim.title}…
        </div>
      </div>
    )
  }

  return (
    <div className="sim-run-page sim-run-phet">
      <PageMeta title={sim.title} description={sim.description} path={`/run/${sim.id}`} />
      <a className="sim-run-exit" href="/simulations">
        ← Catalog
      </a>
      <div className="sim-run-stage">
        <Suspense fallback={<ViewerSkeleton />}>
          <SimulationViewer sim={sim} />
        </Suspense>
      </div>
    </div>
  )
}
