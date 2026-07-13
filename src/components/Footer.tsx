import { Link } from 'react-router-dom'
import { GRADES, gradeLabel } from '../data/simulations'
import './Footer.css'

export function Footer() {
  return (
    <footer id="page-footer" className="ltr">
      <div className="footer-highlight-background">
        <div className="footer-top">
          <p>
            <strong>SimLab Interactive Simulations</strong>
          </p>
          <p>
            Free science experiment simulations for Grades 1–8 — pick a grade, open a sim, and
            learn through exploration.
          </p>
        </div>
      </div>

      <div className="main-footer">
        <div className="footer-content">
          <nav className="footer-links" aria-label="Footer">
            <Link to="/" className="inline-link">
              Home
            </Link>
            <span className="footer-separator" aria-hidden="true">
              |
            </span>
            <Link to="/simulations" className="inline-link">
              Simulations
            </Link>
            {GRADES.map((grade) => (
              <span key={grade}>
                <span className="footer-separator" aria-hidden="true">
                  |
                </span>
                <Link to={`/simulations?grade=${grade}`} className="inline-link">
                  {gradeLabel(grade)}
                </Link>
              </span>
            ))}
            <span className="footer-separator" aria-hidden="true">
              |
            </span>
            <Link to="/about" className="inline-link">
              About
            </Link>
          </nav>

          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SimLab Interactive Simulations
          </p>
        </div>
      </div>
    </footer>
  )
}
