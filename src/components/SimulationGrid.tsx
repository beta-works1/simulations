import { motion, useReducedMotion } from 'motion/react'
import type { Simulation } from '../data/simulations'
import { chapterShortLabel, gradeLabel } from '../data/simulations'
import './SimulationGrid.css'

const ease = [0.22, 1, 0.36, 1] as const

function SimulationThumbnail({ sim }: { sim: Simulation }) {
  const label = sim.chapter ? chapterShortLabel(sim.chapter) : gradeLabel(sim.grade)

  return (
    <div className="simulation-thumbnail" aria-hidden="true">
      <img
        className="simulation-cover"
        src={sim.image}
        alt=""
        width={200}
        height={130}
        loading="lazy"
        decoding="async"
      />
      <span className="simulation-subject">{label}</span>
    </div>
  )
}

interface SimulationGridProps {
  items: Simulation[]
  title?: string
  showTags?: boolean
  animated?: boolean
}

/** Full-page sim URL — opened in a new tab from the catalog. */
export function simulationRunPath(id: string) {
  return `/run/${id}`
}

export function SimulationGrid({
  items,
  title,
  showTags = true,
  animated = false,
}: SimulationGridProps) {
  const reduce = useReducedMotion()

  return (
    <div className="simulation-grid-section">
      {title && <h2 className="simulation-grid-title">{title}</h2>}
      <ul className="simulation-grid">
        {items.map((sim, i) => {
          const card = (
            <a
              href={simulationRunPath(sim.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="simulation-link"
              aria-label={`Open ${sim.title} in a new tab (${gradeLabel(sim.grade)})`}
            >
              <SimulationThumbnail sim={sim} />
              <span className="simulation-list-title">{sim.title}</span>
              {showTags && (
                <span className="simulation-card-tags">
                  <span className="tag tag-grade">{gradeLabel(sim.grade)}</span>
                  {sim.chapter ? <span className="tag">{sim.chapter}</span> : null}
                </span>
              )}
            </a>
          )

          if (!animated) {
            return (
              <li key={sim.id} className="simulation-list-item">
                {card}
              </li>
            )
          }

          return (
            <motion.li
              key={sim.id}
              className="simulation-list-item"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.4), ease }}
              whileHover={reduce ? undefined : { y: -6, transition: { duration: 0.2 } }}
            >
              {card}
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
