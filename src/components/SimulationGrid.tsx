import { type MouseEvent, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Simulation } from '../data/simulations'
import { chapterShortLabel, gradeLabel } from '../data/simulations'
import { downloadOfflineHtml } from '../lib/downloadOfflineHtml'
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

function OfflineDownloadButton({ sim }: { sim: Simulation }) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  if (!sim.offlineHtml) return null

  const onClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (status === 'busy') return
    setStatus('busy')
    try {
      await downloadOfflineHtml(sim.offlineHtml!, `${sim.id}-offline.html`)
      setStatus('done')
      window.setTimeout(() => setStatus('idle'), 1400)
    } catch {
      setStatus('error')
      window.setTimeout(() => setStatus('idle'), 1800)
    }
  }

  const label =
    status === 'busy'
      ? 'Downloading…'
      : status === 'done'
        ? 'Saved ✓'
        : status === 'error'
          ? 'Download failed'
          : '↓ Download offline HTML'

  return (
    <button
      type="button"
      className="simulation-download"
      onClick={onClick}
      disabled={status === 'busy'}
      aria-label={`Download ${sim.title} as offline HTML`}
    >
      {label}
    </button>
  )
}

interface SimulationGridProps {
  items: Simulation[]
  title?: string
  showTags?: boolean
  animated?: boolean
}

/**
 * PhET-style open target: SceneryStack HTML fills the tab like Color Vision;
 * other sims use the full-page /run shell.
 */
export function simulationOpenHref(sim: Simulation) {
  if (sim.sceneryHtml) return sim.sceneryHtml
  return `/run/${sim.id}`
}

/** @deprecated prefer simulationOpenHref(sim) */
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
          const body = (
            <>
              <a
                href={simulationOpenHref(sim)}
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
              <OfflineDownloadButton sim={sim} />
            </>
          )

          if (!animated) {
            return (
              <li key={sim.id} className="simulation-list-item">
                {body}
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
              whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.2 } }}
            >
              {body}
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
