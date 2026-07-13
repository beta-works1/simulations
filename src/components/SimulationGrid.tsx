import { Link } from 'react-router-dom'
import type { Simulation } from '../data/simulations'
import { SUBJECT_ICONS, SUBJECT_LABELS } from '../data/simulations'
import './SimulationGrid.css'

function SimulationThumbnail({ sim }: { sim: Simulation }) {
  return (
    <div
      className="simulation-thumbnail"
      style={{
        background: `linear-gradient(145deg, ${sim.color} 0%, ${sim.accent} 100%)`,
      }}
      aria-hidden="true"
    >
      <div className="simulation-thumbnail-inner">
        <span className="simulation-subject">{SUBJECT_LABELS[sim.subject]}</span>
        <div className="simulation-icon">{SUBJECT_ICONS[sim.subject]}</div>
      </div>
      <span className="sim-badge">HTML5</span>
    </div>
  )
}

interface SimulationGridProps {
  items: Simulation[]
  title?: string
  showTags?: boolean
}

export function SimulationGrid({ items, title, showTags = true }: SimulationGridProps) {
  return (
    <div className="simulation-grid-section">
      {title && <h2 className="simulation-grid-title">{title}</h2>}
      <ul className="simulation-grid">
        {items.map((sim) => (
          <li key={sim.id} className="simulation-list-item">
            <Link
              to={`/play/${sim.id}`}
              className="simulation-link"
              aria-label={`${sim.title}, ${SUBJECT_LABELS[sim.subject]}`}
            >
              <SimulationThumbnail sim={sim} />
              <span className="simulation-list-title">{sim.title}</span>
              {showTags && (
                <span className="simulation-card-tags">
                  <span className={`tag tag-subject tag-${sim.subject}`}>
                    {SUBJECT_LABELS[sim.subject]}
                  </span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
