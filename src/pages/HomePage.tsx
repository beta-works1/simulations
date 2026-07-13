import { Link } from 'react-router-dom'
import { HeroCarousel } from '../components/HeroCarousel'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { GRADES, gradeLabel, getSimulationsByGrade, simulations } from '../data/simulations'
import './HomePage.css'

export function HomePage() {
  const featured = simulations.slice(0, 8)

  return (
    <div className="home-page">
      <PageMeta
        title="SimLab: Science experiment simulations for Grades 1–8"
        description="Free interactive science experiment simulations organized by grade level from Grade 1 to Grade 8."
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
              SimLab creates free interactive science experiment simulations for students in Grades
              1–8. Pick a grade from the panel, then open an experiment and learn by discovery.
            </p>
          </div>
        </section>

        <section className="subjects-section" aria-labelledby="grades-heading">
          <h2 id="grades-heading">Browse by grade</h2>
          <p className="subjects-intro">Jump into Grade 1 through Grade 8.</p>
          <ul className="subject-cards">
            {GRADES.map((grade) => {
              const count = getSimulationsByGrade(grade).length
              return (
                <li key={grade}>
                  <Link to={`/simulations?grade=${grade}`} className="subject-card">
                    <span className="subject-card-icon" aria-hidden="true">
                      {grade}
                    </span>
                    <span className="subject-card-name">{gradeLabel(grade)}</span>
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
            Open Grade Panel
          </Link>
          <Link to="/about" className="btn btn-secondary btn-lg">
            About SimLab
          </Link>
        </section>
      </div>
    </div>
  )
}
