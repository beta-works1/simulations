import { lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { ViewerSkeleton } from '../components/Skeleton'
import { getSimulationById } from '../data/simulations'
import './SimulationRunPage.css'

const SimulationViewer = lazy(() =>
  import('../components/SimulationViewer').then((m) => ({ default: m.SimulationViewer })),
)

/** Full-viewport simulation page — opened in a new tab from the catalog. */
export function SimulationRunPage() {
  const { id } = useParams<{ id: string }>()
  const sim = id ? getSimulationById(id) : undefined

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

  return (
    <div className="sim-run-page">
      <PageMeta title={sim.title} description={sim.description} path={`/run/${sim.id}`} />
      <header className="sim-run-bar">
        <h1 className="sim-run-title">{sim.title}</h1>
        <div className="sim-run-actions">
          <Link to={`/play/${sim.id}`} className="sim-run-link">
            About
          </Link>
          <Link to="/simulations" className="sim-run-link">
            Catalog
          </Link>
        </div>
      </header>
      <div className="sim-run-stage">
        <Suspense fallback={<ViewerSkeleton />}>
          <SimulationViewer sim={sim} />
        </Suspense>
      </div>
    </div>
  )
}
