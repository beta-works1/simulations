import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { ViewerSkeleton } from '../components/Skeleton'
import {
  chapterIdFromTitle,
  getRelatedSimulations,
  getSimulationById,
  gradeLabel,
} from '../data/simulations'
import './SimulationDetailPage.css'

const SimulationViewer = lazy(() =>
  import('../components/SimulationViewer').then((m) => ({ default: m.SimulationViewer })),
)

export function SimulationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sim = id ? getSimulationById(id) : undefined
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [fullscreen])

  if (!sim) {
    return (
      <div className="simulation-detail page-content">
        <PageMeta
          title="Simulation Not Found"
          description="The requested SimLab simulation could not be found."
          path="/simulations"
        />
        <div className="not-found">
          <h1>Simulation Not Found</h1>
          <p>The simulation you are looking for does not exist.</p>
          <Link to="/simulations" className="btn btn-primary">
            Browse simulations
          </Link>
        </div>
      </div>
    )
  }

  const related = getRelatedSimulations(sim)
  const gradePath = `/simulations?grade=${sim.grade}`
  const chapterPath = sim.chapter
    ? `/simulations?grade=${sim.grade}&chapter=${encodeURIComponent(chapterIdFromTitle(sim.chapter))}`
    : gradePath

  return (
    <div className="simulation-detail page-content">
      <PageMeta title={sim.title} description={sim.description} path={`/play/${sim.id}`} />

      <div className="simulation-detail-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/simulations">Simulations</Link>
          <span aria-hidden="true">/</span>
          <Link to={gradePath}>{gradeLabel(sim.grade)}</Link>
          {sim.chapter ? (
            <>
              <span aria-hidden="true">/</span>
              <Link to={chapterPath}>{sim.chapter}</Link>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{sim.title}</span>
        </nav>

        <h1>{sim.title}</h1>
        <div className="detail-tags">
          <Link to={gradePath} className="tag tag-grade">
            {gradeLabel(sim.grade)}
          </Link>
          {sim.chapter ? (
            <Link to={chapterPath} className="tag">
              {sim.chapter}
            </Link>
          ) : null}
        </div>
      </div>

      <div className={`simulation-viewer ${fullscreen ? 'is-fullscreen' : ''}`}>
        {fullscreen && (
          <button
            type="button"
            className="fullscreen-close"
            onClick={() => setFullscreen(false)}
            aria-label="Exit fullscreen"
          >
            Close
          </button>
        )}
        <Suspense fallback={<ViewerSkeleton />}>
          <SimulationViewer sim={sim} />
        </Suspense>
      </div>

      <div className="simulation-actions">
        <button type="button" className="btn btn-primary" onClick={() => setFullscreen(true)}>
          Open fullscreen
        </button>
        {sim.offlineHtml ? (
          <a
            className="btn btn-secondary"
            href={sim.offlineHtml}
            download={`${sim.id}-offline.html`}
          >
            Download HTML (offline)
          </a>
        ) : null}
        <Link to={gradePath} className="btn btn-secondary">
          More {gradeLabel(sim.grade)}
        </Link>
        <Link to="/simulations" className="btn btn-secondary">
          All Grades
        </Link>
      </div>

      {sim.offlineHtml ? (
        <p className="offline-download-note">
          PhET-style offline file: open the downloaded HTML in any browser with no install (built
          with <a href="https://scenerystack.org/">SceneryStack</a>).
        </p>
      ) : null}

      <div className="simulation-info">
        <div className="simulation-info-cover">
          <img src={sim.image} alt="" width={520} height={340} loading="lazy" />
        </div>
        <h2>About this simulation</h2>
        <p>{sim.description}</p>

        <h2>Learning goals</h2>
        <ul className="learning-goals">
          {sim.learningGoals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </div>

      {related.length > 0 && (
        <section className="related-sims" aria-labelledby="related-heading">
          <h2 id="related-heading">Related {gradeLabel(sim.grade)} simulations</h2>
          <SimulationGrid items={related} />
        </section>
      )}
    </div>
  )
}
