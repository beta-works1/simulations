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
            Free science and math simulations for teaching STEM topics, including physics,
            chemistry, biology, and math, through interactive exploration and discovery.
          </p>
        </div>
      </div>

      <div className="main-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#" className="inline-link">About SimLab</a>
            <span className="footer-separator">|</span>
            <a href="#" className="inline-link">Help Center</a>
            <span className="footer-separator">|</span>
            <a href="#" className="inline-link">Contact Us</a>
            <span className="footer-separator">|</span>
            <a href="#" className="inline-link">Privacy Policy</a>
          </div>

          <div className="footer-social">
            <a href="#" aria-label="Facebook"><i className="fa fa-facebook" /></a>
            <a href="#" aria-label="Twitter"><i className="fa fa-twitter" /></a>
            <a href="#" aria-label="YouTube"><i className="fa fa-youtube-play" /></a>
            <a href="#" aria-label="Email"><i className="fa fa-envelope-o" /></a>
          </div>

          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SimLab Interactive Simulations
          </p>
        </div>
      </div>
    </footer>
  )
}
