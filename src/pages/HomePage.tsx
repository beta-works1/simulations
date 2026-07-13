import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { simulations } from '../data/simulations'
import './HomePage.css'

export function HomePage() {
  return (
    <div className="home-page">
      <PageMeta
        title="SimLab: Science experiment simulations"
        description="Free interactive science experiment simulations for students. Browse physics, chemistry, biology, earth science, and math."
        path="/"
      />

      <section className="home-hero page-content">
        <h1>SimLab</h1>
        <p>
          Free interactive science experiment simulations for students — explore, experiment, and
          discover.
        </p>
        <Link to="/simulations" className="btn btn-primary btn-lg">
          Browse Simulations
        </Link>
      </section>

      <SimulationGrid items={simulations} title="Science Experiment Simulations" />

      <section className="cta-section">
        <Link to="/simulations" className="btn btn-secondary btn-lg">
          Open full catalog with search &amp; filters
        </Link>
      </section>
    </div>
  )
}
