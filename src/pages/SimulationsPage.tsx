import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import {
  GRADES,
  gradeLabel,
  getSimulationsByGrade,
  isGrade,
  type Grade,
} from '../data/simulations'
import './SimulationsPage.css'

export function SimulationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const gradeParam = searchParams.get('grade')
  const activeGrade: Grade =
    gradeParam && isGrade(gradeParam) ? (Number(gradeParam) as Grade) : 1

  const sims = useMemo(() => getSimulationsByGrade(activeGrade), [activeGrade])

  const selectGrade = (grade: Grade) => {
    setSearchParams({ grade: String(grade) }, { replace: true })
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
            Science experiment simulations for {gradeLabel(activeGrade)}.
          </p>

          {sims.length > 0 ? (
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
