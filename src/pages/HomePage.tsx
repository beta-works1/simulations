import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Hero } from '../components/Hero'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid, simulationOpenHref } from '../components/SimulationGrid'
import {
  chapterShortLabel,
  getSimulationById,
  gradeLabel,
  type Grade,
  type Simulation,
} from '../data/simulations'
import { SUBJECT_GROUPS } from '../data/subjects'
import './HomePage.css'

const ease = [0.22, 1, 0.36, 1] as const

const FEATURED_IDS = [
  'laws-of-reflection',
  'ph-laboratory',
  'food-web-builder',
  'hydraulic-lift',
  'brain-mapping',
  'galaxy-types',
]

const SHOWCASE_IDS = ['global-warming', 'circuit-construction', 'periodic-table-builder']

const STEPS = [
  {
    title: 'Pick a grade',
    body: 'Grade 8 is split by textbook chapter, so you can go straight to the one you are teaching this week.',
  },
  {
    title: 'Open it in the browser',
    body: 'Each simulation runs in a tab. Nothing to install, no account, no cost.',
  },
  {
    title: 'Change one thing',
    body: 'Drag a slider or move an object and the readouts, graphs and captions update while you watch.',
  },
]

function byId(ids: string[]): Simulation[] {
  return ids
    .map((id) => getSimulationById(id))
    .filter((sim): sim is Simulation => Boolean(sim))
}

function gradeRange(grades: Grade[]): string {
  if (grades.length === 0) return ''
  const min = grades[0]
  const max = grades[grades.length - 1]
  return min === max ? gradeLabel(min) : `Grades ${min}–${max}`
}

function Reveal({
  children,
  className,
  id,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  id?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      id={id}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </motion.section>
  )
}

export function HomePage() {
  const reduce = useReducedMotion()
  const featured = byId(FEATURED_IDS)
  const showcase = byId(SHOWCASE_IDS)

  return (
    <div className="home-page">
      <PageMeta
        title="SimLab: interactive science simulations for Grades 1–8"
        description="Free interactive science and math simulations for students and teachers, organised by grade. Grade 8 follows the Punjab textbook chapters."
        path="/"
      />

      <Hero />

      <div id="main-content" className="home-body">
        <Reveal id="subjects" className="subjects">
          <header className="section-head">
            <p className="section-kicker">What&rsquo;s inside</p>
            <h2>Five subjects, built off the textbook.</h2>
            <p className="section-lede">
              Every simulation runs in the browser — nothing to install, no account, no cost.
            </p>
          </header>

          <ul className="subject-rows">
            {SUBJECT_GROUPS.map((subject, i) => (
              <motion.li
                key={subject.id}
                className="subject-row"
                style={
                  {
                    '--row-accent': `var(${subject.accent})`,
                    '--row-ink': `var(${subject.accentInk})`,
                  } as CSSProperties
                }
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.07, 0.35), ease }}
              >
                <Link to={subject.href} className="subject-row-main">
                  <span className="subject-row-name">{subject.name}</span>
                  <span className="subject-row-blurb">{subject.blurb}</span>
                  <span className="subject-row-meta">
                    <b>{subject.count}</b> sims
                    <span className="subject-row-grades">{gradeRange(subject.grades)}</span>
                  </span>
                  <span className="subject-row-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>

                <ul className="subject-examples">
                  {subject.items.slice(0, 3).map((sim) => (
                    <li key={sim.id}>
                      <a
                        href={simulationOpenHref(sim)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="subject-example"
                      >
                        {sim.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="flow">
          <div className="flow-copy">
            <p className="section-kicker">How it runs</p>
            <h2>Three steps, then they are experimenting.</h2>
            <ol className="flow-steps">
              {STEPS.map((step, i) => (
                <motion.li
                  key={step.title}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                >
                  <span className="flow-num">{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </motion.li>
              ))}
            </ol>
          </div>

          <ul className="flow-shots">
            {showcase.map((sim, i) => (
              <motion.li
                key={sim.id}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: i * 0.1, ease }}
              >
                <a
                  href={simulationOpenHref(sim)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flow-shot"
                >
                  <img
                    src={sim.image}
                    alt={`${sim.title} simulation`}
                    width={320}
                    height={208}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="flow-shot-label">
                    <span>
                      {gradeLabel(sim.grade)}
                      {sim.chapter ? ` · ${chapterShortLabel(sim.chapter)}` : ''}
                    </span>
                    <b aria-hidden="true">open ↗</b>
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="featured">
          <header className="section-head">
            <p className="section-kicker">Start somewhere</p>
            <h2>Open one of these.</h2>
          </header>
          <SimulationGrid items={featured} animated />
        </Reveal>

        <Reveal className="closing">
          <h2>Pick a grade and start experimenting.</h2>
          <p>
            Browse the full library, or jump to the Grade 8 chapter you are teaching this week.
          </p>
          <div className="closing-actions">
            <Link to="/simulations" className="closing-cta">
              Browse every simulation
              <span aria-hidden="true"> →</span>
            </Link>
            <Link to="/about" className="closing-link">
              About SimLab
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
