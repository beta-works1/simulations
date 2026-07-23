import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { PageMeta } from '../components/PageMeta'
import './AboutPage.css'

const ease = [0.22, 1, 0.36, 1] as const

export function AboutPage() {
  const reduce = useReducedMotion()

  return (
    <div className="about-page page-content">
      <PageMeta
        title="About SimLab"
        description="Learn about SimLab interactive science experiment simulations for Grades 1–8."
        path="/about"
      />

      <motion.header
        className="about-header"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <p className="about-kicker">About</p>
        <h1>About SimLab</h1>
        <p>
          SimLab is a free platform for interactive science experiment simulations organized by
          grade level from Grade 1 to Grade 8.
        </p>
        <p>Powered by Beta Works.</p>
      </motion.header>

      <motion.section
        className="about-section"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease }}
      >
        <h2>How it works</h2>
        <ol className="workflow-steps">
          <li>
            <strong>Open Simulations</strong> — use the Grade 1–8 panel on the left.
          </li>
          <li>
            <strong>Pick a grade</strong> — see experiments for that grade.
          </li>
          <li>
            <strong>Open a simulation</strong> — run the experiment and review learning goals.
          </li>
        </ol>
      </motion.section>

      <motion.section
        className="about-section"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, delay: 0.08, ease }}
      >
        <h2>What’s next</h2>
        <p>
          More interactive experiments will be added under each grade over time. The grade panel is
          ready for that content.
        </p>
        <div className="about-actions">
          <Link to="/simulations" className="btn btn-primary">
            Open Grade Panel
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </motion.section>
    </div>
  )
}
