import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { ViewerSkeleton } from '../components/Skeleton'
import {
  SUBJECT_ICONS,
  SUBJECT_LABELS,
  getChapterById,
  getRelatedSimulations,
  getSimulationById,
} from '../data/simulations'
import './SimulationDetailPage.css'

const SimulationViewer = lazy(() =>
  import('../components/SimulationViewer').then((m) => ({ default: m.SimulationViewer })),
)

export function SimulationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sim = id ? getSimulationById(id) : undefined
  const [fullscreen, setFullscreen] = useState(false)
  const chapter = sim ? getChapterById(sim.chapterId) : undefined

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
            Browse all simulations
          </Link>
        </div>
      </div>
    )
  }

  const related = getRelatedSimulations(sim)
  const subjectPath = `/simulations/${sim.subject}`
  const chapterPath = `${subjectPath}?chapter=${sim.chapterId}`

  return (
    <div className="simulation-detail page-content">
      <PageMeta title={sim.title} description={sim.description} path={`/play/${sim.id}`} />

      <div className="simulation-detail-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/simulations">Simulations</Link>
          <span aria-hidden="true">/</span>
          <Link to={subjectPath}>{SUBJECT_LABELS[sim.subject]}</Link>
          {chapter && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={chapterPath}>{chapter.title}</Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{sim.title}</span>
        </nav>

        <h1>{sim.title}</h1>
        <div className="detail-tags">
          <Link to={subjectPath} className={`tag tag-subject tag-${sim.subject}`}>
            {SUBJECT_LABELS[sim.subject]}
          </Link>
          {chapter && (
            <Link to={chapterPath} className="tag tag-chapter">
              {chapter.title}
            </Link>
          )}
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
        <Link to={chapterPath} className="btn btn-secondary">
          Back to chapter
        </Link>
        <Link to={subjectPath} className="btn btn-secondary">
          More {SUBJECT_LABELS[sim.subject]}
        </Link>
      </div>

      <div className="simulation-info">
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
          <h2 id="related-heading">Related simulations</h2>
          <SimulationGrid items={related} />
        </section>
      )}

      <p className="subject-hint" aria-hidden="true">
        {SUBJECT_ICONS[sim.subject]}
      </p>
    </div>
  )
}
