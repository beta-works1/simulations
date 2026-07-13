import { Link } from 'react-router-dom'
import type { Simulation } from '../data/simulations'
import { SUBJECT_LABELS } from '../data/simulations'
import './SimulationGrid.css'

function SimulationThumbnail({ sim }: { sim: Simulation }) {
  return (
    <div
      className="simulation-thumbnail"
      style={{
        background: `linear-gradient(145deg, ${sim.color} 0%, ${sim.accent} 100%)`,
      }}
    >
      <div className="simulation-thumbnail-inner">
        <span className="simulation-subject">{SUBJECT_LABELS[sim.subject]}</span>
        <div className="simulation-icon">
          {sim.subject === 'physics' && '⚛'}
          {sim.subject === 'chemistry' && '🧪'}
          {sim.subject === 'biology' && '🧬'}
          {sim.subject === 'earth-and-space' && '🌍'}
          {sim.subject === 'math-and-statistics' && '📐'}
        </div>
      </div>
      <span className="sim-badge">HTML5</span>
    </div>
  )
}

interface SimulationGridProps {
  items: Simulation[]
  title?: string
}

export function SimulationGrid({ items, title }: SimulationGridProps) {
  return (
    <div className="simulation-grid-section">
      {title && <h2 className="simulation-grid-title">{title}</h2>}
      <div className="simulation-grid">
        {items.map((sim) => (
          <div key={sim.id} className="simulation-list-item">
            <Link to={`/simulations/${sim.id}`} className="simulation-link">
              <SimulationThumbnail sim={sim} />
              <span className="simulation-list-title">{sim.title}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
