import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import {
  GRADES,
  gradeLabel,
  getChaptersForGrade,
  getSimulationsByGrade,
  getSimulationsByGradeChapter,
  isGrade,
  type Grade,
} from '../data/simulations'
import './SimulationsPage.css'

export function SimulationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const gradeParam = searchParams.get('grade')
  const chapterParam = searchParams.get('chapter')
  const activeGrade: Grade =
    gradeParam && isGrade(gradeParam) ? (Number(gradeParam) as Grade) : 1

  const chapters = useMemo(() => getChaptersForGrade(activeGrade), [activeGrade])
  const hasChapters = chapters.length > 0

  const activeChapterId = useMemo(() => {
    if (!hasChapters) return null
    if (chapterParam && chapters.some((c) => c.id === chapterParam)) return chapterParam
    return chapters[0]?.id ?? null
  }, [hasChapters, chapterParam, chapters])

  const activeChapter = chapters.find((c) => c.id === activeChapterId)

  const sims = useMemo(
    () =>
      hasChapters
        ? getSimulationsByGradeChapter(activeGrade, activeChapterId)
        : getSimulationsByGrade(activeGrade),
    [activeGrade, activeChapterId, hasChapters],
  )

  const selectGrade = (grade: Grade) => {
    const nextChapters = getChaptersForGrade(grade)
    const next: Record<string, string> = { grade: String(grade) }
    if (nextChapters[0]) next.chapter = nextChapters[0].id
    setSearchParams(next, { replace: true })
  }

  const selectChapter = (chapterId: string) => {
    setSearchParams({ grade: String(activeGrade), chapter: chapterId }, { replace: true })
  }

  return (
    <div className="simulations-page page-content">
      <PageMeta
        title="Simulations by Grade"
        description="Browse science experiment simulations for Grade 1 through Grade 10."
        path="/simulations"
      />

      <header className="simulations-header">
        <h1>Simulations</h1>
        <p>
          Choose a grade
          {hasChapters ? ', then a chapter,' : ''} then open a science experiment simulation.
        </p>
      </header>

      <div className={`grade-layout${hasChapters ? ' has-chapters' : ''}`}>
        <aside className="grade-panel" aria-label="Grades">
          <div className="grade-panel-head">
            <h2 className="grade-panel-title">Grade panel</h2>
            <p className="grade-panel-hint">Grades 1 to 10</p>
          </div>
          <ul className="grade-list" role="listbox" aria-label="Grades 1 to 10">
            {GRADES.map((grade) => {
              const count = getSimulationsByGrade(grade).length
              const selected = grade === activeGrade
              return (
                <li key={grade} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`grade-item${selected ? ' is-active' : ''}`}
                    onClick={() => selectGrade(grade)}
                  >
                    <span className="grade-item-title">{gradeLabel(grade)}</span>
                    <span className="grade-item-count">
                      {count} sim{count !== 1 ? 's' : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {hasChapters && (
          <aside className="chapter-panel" aria-label="Chapters">
            <div className="chapter-panel-head">
              <h2 className="chapter-panel-title">Chapter panel</h2>
              <p className="chapter-panel-hint">{gradeLabel(activeGrade)} textbook chapters</p>
            </div>
            <ul className="chapter-list" role="listbox" aria-label={`${gradeLabel(activeGrade)} chapters`}>
              {chapters.map((chapter) => {
                const count = getSimulationsByGradeChapter(activeGrade, chapter.id).length
                const selected = chapter.id === activeChapterId
                return (
                  <li key={chapter.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={`chapter-item${selected ? ' is-active' : ''}`}
                      onClick={() => selectChapter(chapter.id)}
                    >
                      <span className="chapter-item-title">{chapter.title}</span>
                      <span className="chapter-item-count">
                        {count} sim{count !== 1 ? 's' : ''}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        )}

        <section className="grade-sims" aria-labelledby="grade-sims-heading">
          <h2 id="grade-sims-heading">
            {activeChapter
              ? activeChapter.title
              : `${gradeLabel(activeGrade)} simulations`}
          </h2>
          <p className="grade-sims-desc">
            {activeChapter
              ? `Science experiment simulations for ${activeChapter.title} (${gradeLabel(activeGrade)}).`
              : `Science experiment simulations for ${gradeLabel(activeGrade)}.`}
          </p>

          {sims.length > 0 ? (
            <SimulationGrid items={sims} showTags />
          ) : (
            <div className="grade-empty" role="status">
              <p>No simulations for this {hasChapters ? 'chapter' : 'grade'} yet. Check back soon.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
