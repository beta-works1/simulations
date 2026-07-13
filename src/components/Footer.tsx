import { Link } from 'react-router-dom'
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
            Free science and math simulations for students, aligned with Punjab SNC learning
            outcomes — explore physics, chemistry, biology, earth science, and math through
            discovery.
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
          </nav>

          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SimLab Interactive Simulations
          </p>
        </div>
      </div>
    </footer>
  )
}
