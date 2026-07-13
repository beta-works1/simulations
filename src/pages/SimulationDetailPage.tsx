import { Link, useParams } from 'react-router-dom'
import { simulations, SUBJECT_LABELS } from '../data/simulations'
import './SimulationDetailPage.css'

export function SimulationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sim = simulations.find((s) => s.id === id)

  if (!sim) {
    return (
      <div className="simulation-detail page-content">
        <div className="not-found">
          <h1>Simulation Not Found</h1>
          <p>The simulation you are looking for does not exist.</p>
          <Link to="/simulations">Browse all simulations</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="simulation-detail page-content">
      <div className="simulation-detail-header">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/simulations">Simulations</Link>
          <span>/</span>
          <span>{sim.title}</span>
        </nav>

        <h1>{sim.title}</h1>
        <span className="subject-tag">{SUBJECT_LABELS[sim.subject]}</span>
      </div>

      <div className="simulation-viewer">
        <div
          className="simulation-placeholder"
          style={{
            background: `linear-gradient(145deg, ${sim.color} 0%, ${sim.accent} 100%)`,
          }}
        >
          <div className="placeholder-content">
            <span className="placeholder-icon">
              {sim.subject === 'physics' && '⚛'}
              {sim.subject === 'chemistry' && '🧪'}
              {sim.subject === 'biology' && '🧬'}
              {sim.subject === 'earth-and-space' && '🌍'}
              {sim.subject === 'math-and-statistics' && '📐'}
            </span>
            <p>Simulation loading area</p>
            <p className="placeholder-note">
              Interactive simulation will be embedded here
            </p>
          </div>
        </div>
      </div>

      <div className="simulation-info">
        <h2>About this simulation</h2>
        <p>{sim.description}</p>

        <div className="simulation-actions">
          <button type="button" className="phet-button primary">
            Run Simulation
          </button>
          <Link to="/simulations" className="phet-button secondary">
            Back to Simulations
          </Link>
        </div>
      </div>
    </div>
  )
}
