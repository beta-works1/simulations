import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import {
  GRADES,
  gradeLabel,
  getSimulationsByGrade,
  groupSimulationsByChapter,
  isGrade,
  type Grade,
} from '../data/simulations'
import './SimulationsPage.css'

function chapterAnchorId(chapter: string): string {
  return `chapter-${chapter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}

export function SimulationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const gradeParam = searchParams.get('grade')
  const activeGrade: Grade =
    gradeParam && isGrade(gradeParam) ? (Number(gradeParam) as Grade) : 1

  const sims = useMemo(() => getSimulationsByGrade(activeGrade), [activeGrade])
  const chapterGroups = useMemo(
    () => (activeGrade === 8 ? groupSimulationsByChapter(sims) : []),
    [activeGrade, sims],
  )
  const useChapters = activeGrade === 8 && chapterGroups.length > 0

  const selectGrade = (grade: Grade) => {
    setSearchParams({ grade: String(grade) }, { replace: true })
  }

  const jumpToChapter = (chapter: string) => {
    const el = document.getElementById(chapterAnchorId(chapter))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="simulations-page page-content">
      <PageMeta
        title="Simulations by Grade"
        description="Browse science experiment simulations for Grade 1 through Grade 8."
        path="/simulations"
      />

      <header className="simulations-header">
        <h1>Simulations</h1>
        <p>Choose a grade in the panel, then open a science experiment simulation.</p>
      </header>

      <div className="grade-layout">
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

        <section className="grade-sims" aria-labelledby="grade-sims-heading">
          <h2 id="grade-sims-heading">{gradeLabel(activeGrade)} simulations</h2>
          <p className="grade-sims-desc">
            {useChapters
              ? 'Browse Grade 8 chapter by chapter — jump to Ch 1, Ch 2, Ch 3, Ch 4, and more.'
              : `Science experiment simulations for ${gradeLabel(activeGrade)}.`}
          </p>

          {useChapters ? (
            <>
              <nav className="chapter-jump" aria-label="Grade 8 chapters">
                {chapterGroups.map((group) => (
                  <button
                    key={group.chapter}
                    type="button"
                    className="chapter-jump-btn"
                    onClick={() => jumpToChapter(group.chapter)}
                  >
                    <span className="chapter-jump-short">{group.shortLabel}</span>
                    <span className="chapter-jump-count">{group.items.length}</span>
                  </button>
                ))}
              </nav>

              <div className="chapter-sections">
                {chapterGroups.map((group) => (
                  <section
                    key={group.chapter}
                    id={chapterAnchorId(group.chapter)}
                    className="chapter-section"
                    aria-labelledby={`${chapterAnchorId(group.chapter)}-heading`}
                  >
                    <header className="chapter-section-head">
                      <p className="chapter-kicker">{group.shortLabel}</p>
                      <h3 id={`${chapterAnchorId(group.chapter)}-heading`}>{group.chapter}</h3>
                      <p className="chapter-count">
                        {group.items.length} simulation{group.items.length !== 1 ? 's' : ''}
                      </p>
                    </header>
                    <SimulationGrid items={group.items} showTags />
                  </section>
                ))}
              </div>
            </>
          ) : sims.length > 0 ? (
            <SimulationGrid items={sims} showTags />
          ) : (
            <div className="grade-empty" role="status">
              <p>No simulations for this grade yet. Check back soon.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
