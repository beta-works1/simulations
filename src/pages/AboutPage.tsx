import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import './AboutPage.css'

export function AboutPage() {
  return (
    <div className="about-page page-content">
      <PageMeta
        title="About SimLab"
        description="Learn about SimLab interactive science experiment simulations and how the PhET-inspired discovery workflow works."
        path="/about"
      />

      <header className="about-header">
        <h1>About SimLab</h1>
        <p>
          SimLab is a free platform for interactive science experiment simulations. Students
          explore physics, chemistry, biology, earth science, and math through play and discovery.
        </p>
      </header>

      <section className="about-section">
        <h2>How it works (PhET-style workflow)</h2>
        <ol className="workflow-steps">
          <li>
            <strong>Start on Home</strong> — see featured sims and browse by subject.
          </li>
          <li>
            <strong>Open Simulations</strong> — search or filter by subject (Physics, Chemistry,
            and more).
          </li>
          <li>
            <strong>Open a simulation</strong> — read goals, then run the interactive experiment.
          </li>
          <li>
            <strong>Explore related sims</strong> — continue learning in the same subject.
          </li>
        </ol>
      </section>

      <section className="about-section">
        <h2>What’s next</h2>
        <p>
          New interactive science experiment simulations will be added into the Simulations catalog
          over time. The page structure is ready — open a sim page to see where each experiment
          will load.
        </p>
        <div className="about-actions">
          <Link to="/simulations" className="btn btn-primary">
            Browse Simulations
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  )
}
