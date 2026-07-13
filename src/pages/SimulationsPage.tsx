import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import {
  SUBJECT_ICONS,
  SUBJECT_LABELS,
  SUBJECT_ORDER,
  getChaptersBySubject,
  getSimulationsBySubject,
  simulations,
} from '../data/simulations'
import './SimulationsPage.css'

export function SimulationsPage() {
  return (
    <div className="simulations-page page-content">
      <PageMeta
        title="Simulations"
        description="Choose a subject to browse science experiment simulations by chapter."
        path="/simulations"
      />

      <header className="simulations-header">
        <h1>Simulations</h1>
        <p>
          Start with a subject, then open its chapter panel to find science experiment simulations.
        </p>
      </header>

      <ul className="sims-subject-grid">
        {SUBJECT_ORDER.map((subject) => {
          const chapterCount = getChaptersBySubject(subject).length
          const simCount = getSimulationsBySubject(subject).length
          return (
            <li key={subject}>
              <Link to={`/simulations/${subject}`} className="sims-subject-card">
                <span className="sims-subject-icon" aria-hidden="true">
                  {SUBJECT_ICONS[subject]}
                </span>
                <span className="sims-subject-name">{SUBJECT_LABELS[subject]}</span>
                <span className="sims-subject-meta">
                  {chapterCount} chapter{chapterCount !== 1 ? 's' : ''} · {simCount} sim
                  {simCount !== 1 ? 's' : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="sims-total">
        {simulations.length} simulations available across {SUBJECT_ORDER.length} subjects
      </p>
    </div>
  )
}
