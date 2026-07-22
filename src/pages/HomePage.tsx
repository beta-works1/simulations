import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Hero } from '../components/Hero'
import { ScrollScene } from '../components/ScrollScene'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { GRADES, gradeLabel, getSimulationsByGrade } from '../data/simulations'
import './HomePage.css'

const ease = [0.22, 1, 0.36, 1] as const

function MotionSection({
  children,
  className,
  id,
  'aria-labelledby': labelledBy,
}: {
  children: ReactNode
  className?: string
  id?: string
  'aria-labelledby'?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      id={id}
      aria-labelledby={labelledBy}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease }}
    >
      {children}
    </motion.section>
  )
}

export function HomePage() {
  const reduce = useReducedMotion()

  const featured = GRADES.map((grade) => {
    const pool = getSimulationsByGrade(grade)
    if (grade === 8) {
      return (
        pool.find((s) => s.chapter?.startsWith('Ch 1')) ??
        pool.find((s) => s.chapter && !s.chapter.startsWith('More')) ??
        pool[0]
      )
    }
    return pool[0]
  }).filter((s): s is NonNullable<typeof s> => Boolean(s))

  return (
    <div className="home-page">
      <PageMeta
        title="SimLab: Science experiment simulations for Grades 1–8"
        description="Free interactive science experiment simulations organized by grade level from Grade 1 to Grade 8."
        path="/"
      />

      <ScrollScene />

      <div className="home-foreground">
        <Hero />

        <div id="main-content" className="page-content home-panels">
          <MotionSection className="intro-section" id="what-is-simlab">
            <p className="section-kicker">About</p>
            <h2>What is SimLab?</h2>
            <p>
              SimLab creates free interactive science experiment simulations for students in Grades
              1–8. Pick a grade, open an experiment, and learn by discovery.
            </p>
          </MotionSection>

          <MotionSection className="subjects-section" aria-labelledby="grades-heading">
            <p className="section-kicker">Curriculum</p>
            <h2 id="grades-heading">Browse by grade</h2>
            <p className="subjects-intro">Jump into Grade 1 through Grade 8.</p>
            <ul className="subject-cards">
              {GRADES.map((grade, i) => {
                const count = getSimulationsByGrade(grade).length
                return (
                  <motion.li
                    key={grade}
                    initial={reduce ? false : { opacity: 0, y: 20, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: i * 0.05, ease }}
                    whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.2 } }}
                  >
                    <Link to={`/simulations?grade=${grade}`} className="subject-card">
                      <span className="subject-card-icon" aria-hidden="true">
                        {grade}
                      </span>
                      <span className="subject-card-name">{gradeLabel(grade)}</span>
                      <span className="subject-card-count">
                        {count} sim{count !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </MotionSection>

          <MotionSection className="featured-wrap">
            <SimulationGrid items={featured} title="Featured Simulations" animated />
          </MotionSection>

          <MotionSection className="cta-section">
            <h2 className="cta-title">Ready to experiment?</h2>
            <p className="cta-copy">Open the grade panel and start exploring.</p>
            <div className="cta-actions">
              <Link to="/simulations" className="btn btn-primary btn-lg">
                Open Grade Panel
              </Link>
              <Link to="/about" className="btn btn-secondary btn-lg">
                About SimLab
              </Link>
            </div>
          </MotionSection>
        </div>
      </div>
    </div>
  )
}
