import { Link } from 'react-router-dom'
import { HeroCarousel } from '../components/HeroCarousel'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { GRADES, gradeLabel, getSimulationsByGrade } from '../data/simulations'
import './HomePage.css'

export function HomePage() {
  // One featured sim per grade so Grade 8 always appears alongside 1–7.
  // Prefer textbook chapter sims over "More Grade 8" fillers.
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
        title="SimLab: Science experiment simulations for Grades 1–10"
        description="Free interactive science experiment simulations organized by grade level from Grade 1 to Grade 10."
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
              1–10. Pick a grade from the panel, then open an experiment and learn by discovery.
            </p>
          </div>
        </section>

        <section className="subjects-section" aria-labelledby="grades-heading">
          <h2 id="grades-heading">Browse by grade</h2>
          <p className="subjects-intro">Jump into Grade 1 through Grade 10.</p>
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
