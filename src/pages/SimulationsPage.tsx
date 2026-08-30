import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
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

const ease = [0.22, 1, 0.36, 1] as const
const ALL_CHAPTERS_ID = 'all'

export function SimulationsPage() {
  const reduce = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const gradeParam = searchParams.get('grade')
  const chapterParam = searchParams.get('chapter')
  const activeGrade: Grade =
    gradeParam && isGrade(gradeParam) ? (Number(gradeParam) as Grade) : 1

  const chapters = useMemo(() => getChaptersForGrade(activeGrade), [activeGrade])
  const hasChapters = chapters.length > 0

  const activeChapterId = useMemo(() => {
    if (!hasChapters) return null
    if (!chapterParam || chapterParam === ALL_CHAPTERS_ID) return ALL_CHAPTERS_ID
    if (chapters.some((c) => c.id === chapterParam)) return chapterParam
    return ALL_CHAPTERS_ID
  }, [hasChapters, chapterParam, chapters])

  const activeChapter = chapters.find((c) => c.id === activeChapterId)
  const showingAll = !hasChapters || activeChapterId === ALL_CHAPTERS_ID

  const isFinalSuite = activeChapterId === 'final-pctb-labs'

  const sims = useMemo(
    () =>
      showingAll
        ? getSimulationsByGrade(activeGrade)
        : getSimulationsByGradeChapter(activeGrade, activeChapterId),
    [activeGrade, activeChapterId, showingAll],
  )

  const selectGrade = (grade: Grade) => {
    setSearchParams({ grade: String(grade) }, { replace: true })
  }

  const selectChapter = (chapterId: string) => {
    if (chapterId === ALL_CHAPTERS_ID) {
      setSearchParams({ grade: String(activeGrade) }, { replace: true })
      return
    }
    setSearchParams({ grade: String(activeGrade), chapter: chapterId }, { replace: true })
  }

  return (
    <div className="simulations-page page-content">
      <PageMeta
        title="Simulations by Grade"
        description="Browse science experiment simulations for Grade 1 through Grade 8."
        path="/simulations"
      />

      <motion.header
        className="simulations-header"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
      >
        <h1>Simulations</h1>
        <p>
          Choose a grade
          {hasChapters ? ', then a chapter,' : ''} then open a science experiment simulation.
        </p>
      </motion.header>

      <motion.div
        className={`grade-layout${hasChapters ? ' has-chapters' : ''}`}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease }}
      >
        <aside className="grade-panel" aria-label="Grades">
          <div className="grade-panel-head">
            <h2 className="grade-panel-title">Grade panel</h2>
            <p className="grade-panel-hint">Grades 1 to 8</p>
          </div>
          <ul className="grade-list" role="listbox" aria-label="Grades 1 to 8">
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
              <li role="option" aria-selected={showingAll}>
                <button
                  type="button"
                  className={`chapter-item${showingAll ? ' is-active' : ''}`}
                  onClick={() => selectChapter(ALL_CHAPTERS_ID)}
                >
                  <span className="chapter-item-title">All chapters</span>
                  <span className="chapter-item-count">
                    {getSimulationsByGrade(activeGrade).length} sims
                  </span>
                </button>
              </li>
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
            {isFinalSuite
              ? 'Final simulations'
              : showingAll
                ? `${gradeLabel(activeGrade)} simulations`
                : activeChapter
                  ? activeChapter.title
                  : `${gradeLabel(activeGrade)} simulations`}
          </h2>
          <p className="grade-sims-desc">
            {isFinalSuite
              ? 'Twelve Class 8 science experiment simulations — open any card to run it in the browser.'
              : showingAll
                ? `All science experiment simulations for ${gradeLabel(activeGrade)}.`
                : activeChapter
                  ? `Science experiment simulations for ${activeChapter.title} (${gradeLabel(activeGrade)}).`
                  : `Science experiment simulations for ${gradeLabel(activeGrade)}.`}
          </p>

          {sims.length > 0 ? (
            <SimulationGrid items={sims} showTags />
          ) : (
            <div className="grade-empty" role="status">
              <p>No simulations for this {hasChapters && !showingAll ? 'chapter' : 'grade'} yet. Check back soon.</p>
            </div>
          )}
        </section>
      </motion.div>
    </div>
  )
}
