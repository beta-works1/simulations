import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { GRADES, gradeLabel } from '../data/simulations'
import './Footer.css'

export function Footer() {
  const reduce = useReducedMotion()

  return (
    <motion.footer
      id="page-footer"
      className="ltr site-footer"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="footer-band">
        <p className="footer-brand">SimLab</p>
        <p className="footer-tagline">
          Free science experiment simulations for Grades 1–8 — pick a grade, open a sim, and learn
          through exploration.
        </p>
      </div>

      <div className="main-footer">
        <div className="footer-content">
          <nav className="footer-links" aria-label="Footer">
            <Link to="/">Home</Link>
            <Link to="/simulations">Simulations</Link>
            {GRADES.map((grade) => (
              <Link key={grade} to={`/simulations?grade=${grade}`}>
                {gradeLabel(grade)}
              </Link>
            ))}
            <Link to="/about">About</Link>
          </nav>

          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SimLab Interactive Simulations
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
