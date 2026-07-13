import { Link } from 'react-router-dom'
import { HeroCarousel } from '../components/HeroCarousel'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { simulations } from '../data/simulations'
import './HomePage.css'

export function HomePage() {
  const featured = simulations.slice(0, 8)

  return (
    <div className="home-page">
      <PageMeta
        title="SimLab: Free online physics, chemistry, biology, earth science and math simulations"
        description="Free interactive science and math simulations for students. Explore STEM topics aligned with Punjab SNC through game-like discovery."
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
              SimLab Interactive Simulations creates free interactive math and science
              simulations for students. Sims are designed for exploration and discovery — an
              intuitive, game-like environment that supports Punjab SNC learning goals across
              physics, chemistry, biology, earth science, and math.
            </p>
          </div>
        </section>

        <SimulationGrid items={featured} title="Featured Simulations" />

        <section className="cta-section">
          <Link to="/simulations" className="btn btn-primary btn-lg">
            View All Simulations
          </Link>
        </section>
      </div>
    </div>
  )
}
