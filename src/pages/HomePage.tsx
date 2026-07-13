import { Link } from 'react-router-dom'
import { HeroCarousel } from '../components/HeroCarousel'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import {
  SUBJECT_ICONS,
  SUBJECT_LABELS,
  SUBJECT_ORDER,
  getSimulationsBySubject,
  simulations,
} from '../data/simulations'
import './HomePage.css'

export function HomePage() {
  const featured = simulations.slice(0, 8)

  return (
    <div className="home-page">
      <PageMeta
        title="SimLab: Free online physics, chemistry, biology, earth science and math simulations"
        description="Free interactive science experiment simulations. Browse by subject, open a sim, and learn through exploration — inspired by PhET."
        path="/"
      />

      <HeroCarousel />

      <div id="main-content" className="page-content">
        <section className="intro-section">
          <div className="intro-buttons">
            <Link to="/simulations" className="btn btn-primary btn-lg play-with-sims-button">
              Play with Sims
            </Link>
          </div>

          <div id="what-is-simlab">
            <h2>What is SimLab?</h2>
            <p>
              SimLab creates free interactive science and math simulations for students. Follow the
              same discovery workflow as PhET: pick a subject, browse simulations, open one, and
              learn by experimenting.
            </p>
          </div>
        </section>

        <section className="subjects-section" aria-labelledby="subjects-heading">
          <h2 id="subjects-heading">Browse by subject</h2>
          <p className="subjects-intro">
            Jump straight into a subject catalog — just like PhET’s Simulations menu.
          </p>
          <ul className="subject-cards">
            {SUBJECT_ORDER.map((subject) => {
              const count = getSimulationsBySubject(subject).length
              return (
                <li key={subject}>
                  <Link to={`/simulations?subject=${subject}`} className="subject-card">
                    <span className="subject-card-icon" aria-hidden="true">
                      {SUBJECT_ICONS[subject]}
                    </span>
                    <span className="subject-card-name">{SUBJECT_LABELS[subject]}</span>
                    <span className="subject-card-count">
                      {count} sim{count !== 1 ? 's' : ''}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <SimulationGrid items={featured} title="Featured Simulations" />

        <section className="cta-section">
          <Link to="/simulations" className="btn btn-primary btn-lg">
            View All Simulations
          </Link>
          <Link to="/about" className="btn btn-secondary btn-lg">
            About SimLab
          </Link>
        </section>
      </div>
    </div>
  )
}
