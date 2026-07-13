import { Link } from 'react-router-dom'
import type { Simulation } from '../data/simulations'
import { chapterShortLabel, gradeLabel } from '../data/simulations'
import './SimulationGrid.css'

function SimulationThumbnail({ sim }: { sim: Simulation }) {
  const label = sim.chapter ? chapterShortLabel(sim.chapter) : gradeLabel(sim.grade)

  return (
    <div className="simulation-thumbnail" aria-hidden="true">
      <img
        className="simulation-cover"
        src={sim.image}
        alt=""
        width={130}
        height={85}
        loading="lazy"
        decoding="async"
      />
      <span className="simulation-subject">{label}</span>
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
              aria-label={`${sim.title}, ${gradeLabel(sim.grade)}`}
            >
              <SimulationThumbnail sim={sim} />
              <span className="simulation-list-title">{sim.title}</span>
              {showTags && (
                <span className="simulation-card-tags">
                  <span className="tag tag-grade">{gradeLabel(sim.grade)}</span>
                  {sim.chapter ? <span className="tag">{sim.chapter}</span> : null}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
