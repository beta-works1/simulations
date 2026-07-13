import { Link } from 'react-router-dom'
import { HeroCarousel } from '../components/HeroCarousel'
import { SimulationGrid } from '../components/SimulationGrid'
import { simulations } from '../data/simulations'
import './HomePage.css'

export function HomePage() {
  const featured = simulations.slice(0, 8)

  return (
    <div className="home-page">
      <HeroCarousel />

      <div id="main-content" className="page-content">
        <section className="intro-section">
          <div className="intro-buttons">
            <Link to="/simulations" className="front-page-button play-with-sims-button">
              Play with Sims
            </Link>
          </div>

          <div id="what-is-phet">
            <h2>What is SimLab?</h2>
            <p>
              Founded to make science and math come alive, SimLab Interactive Simulations
              creates free interactive math and science simulations. SimLab sims are based on
              extensive education research and engage students through an intuitive, game-like
              environment where students learn through exploration and discovery.
            </p>
          </div>
        </section>

        <SimulationGrid items={featured} title="Featured Simulations" />

        <section className="cta-section">
          <Link to="/simulations" className="play-with-sims-button large">
            View All Simulations
          </Link>
        </section>
      </div>
    </div>
  )
}
