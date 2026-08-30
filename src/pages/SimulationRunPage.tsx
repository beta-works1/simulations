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
 * Full-viewport launcher.
 * React canvas sims and Scenery / final HTML labs all embed in this shell
 * (HTML labs via iframe) so catalog cards open the same way.
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

  const backHref =
    sim.grade === 8
      ? `/simulations?grade=8`
      : `/simulations?grade=${sim.grade}`

  return (
    <div className="sim-run-page sim-run-phet">
      <PageMeta title={sim.title} description={sim.description} path={`/run/${sim.id}`} />
      <a className="sim-run-exit" href={backHref}>
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
