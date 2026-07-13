import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import {
  SUBJECT_ICONS,
  SUBJECT_LABELS,
  getChapterById,
  getChaptersBySubject,
  getSimulationsByChapter,
  getSimulationsBySubject,
  isSubject,
  type Subject,
} from '../data/simulations'
import './SubjectChaptersPage.css'

export function SubjectChaptersPage() {
  const { subject: subjectParam } = useParams<{ subject: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileChaptersOpen, setMobileChaptersOpen] = useState(false)

  const valid = Boolean(subjectParam && isSubject(subjectParam))
  const subject = (valid ? subjectParam : 'physics') as Subject

  const subjectChapters = useMemo(() => getChaptersBySubject(subject), [subject])
  const chapterFromUrl = searchParams.get('chapter')
  const activeChapterId =
    chapterFromUrl && subjectChapters.some((c) => c.id === chapterFromUrl)
      ? chapterFromUrl
      : subjectChapters[0]?.id ?? null

  const activeChapter = activeChapterId ? getChapterById(activeChapterId) : undefined

  const sims = useMemo(() => {
    if (!activeChapterId) return getSimulationsBySubject(subject)
    return getSimulationsByChapter(activeChapterId)
  }, [activeChapterId, subject])

  if (!valid) {
    return <Navigate to="/simulations" replace />
  }

  const selectChapter = (chapterId: string) => {
    setSearchParams({ chapter: chapterId }, { replace: true })
    setMobileChaptersOpen(false)
  }

  return (
    <div className="subject-chapters-page page-content">
      <PageMeta
        title={`${SUBJECT_LABELS[subject]} Simulations`}
        description={`Browse ${SUBJECT_LABELS[subject]} science experiment simulations by chapter.`}
        path={`/simulations/${subject}`}
      />

      <nav className="chapter-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/simulations">Simulations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{SUBJECT_LABELS[subject]}</span>
      </nav>

      <header className="subject-chapters-header">
        <div className="subject-chapters-title-row">
          <span className="subject-chapters-icon" aria-hidden="true">
            {SUBJECT_ICONS[subject]}
          </span>
          <div>
            <h1>{SUBJECT_LABELS[subject]}</h1>
            <p>Select a chapter, then open a simulation experiment.</p>
          </div>
        </div>

        <button
          type="button"
          className="chapters-toggle"
          aria-expanded={mobileChaptersOpen}
          onClick={() => setMobileChaptersOpen((o) => !o)}
        >
          {mobileChaptersOpen ? 'Hide chapters' : 'Show chapters'}
        </button>
      </header>

      <div className="subject-chapters-layout">
        <aside
          className={`chapter-panel${mobileChaptersOpen ? ' is-open' : ''}`}
          aria-label="Chapters"
        >
          <h2 className="chapter-panel-title">Chapters</h2>
          <ul className="chapter-list">
            {subjectChapters.map((chapter) => {
              const count = getSimulationsByChapter(chapter.id).length
              const selected = chapter.id === activeChapterId
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className={`chapter-item${selected ? ' is-active' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => selectChapter(chapter.id)}
                  >
                    <span className="chapter-item-title">{chapter.title}</span>
                    <span className="chapter-item-count">
                      {count} sim{count !== 1 ? 's' : ''}
                    </span>
                    <span className="chapter-item-desc">{chapter.description}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className="chapter-sims" aria-labelledby="chapter-sims-heading">
          <h2 id="chapter-sims-heading">
            {activeChapter ? activeChapter.title : 'Simulations'}
          </h2>
          {activeChapter && <p className="chapter-sims-desc">{activeChapter.description}</p>}

          {sims.length > 0 ? (
            <SimulationGrid items={sims} showTags={false} />
          ) : (
            <div className="chapter-empty" role="status">
              <p>No simulations in this chapter yet. Check back soon.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
