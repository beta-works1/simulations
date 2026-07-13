import { Link } from 'react-router-dom'
import { SUBJECT_LABELS, SUBJECT_ORDER } from '../data/simulations'
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
            Free science experiment simulations for students — browse by subject, open a sim, and
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
              All Sims
            </Link>
            {SUBJECT_ORDER.map((subject) => (
              <span key={subject}>
                <span className="footer-separator" aria-hidden="true">
                  |
                </span>
                <Link to={`/simulations?subject=${subject}`} className="inline-link">
                  {SUBJECT_LABELS[subject]}
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
