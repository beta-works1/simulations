import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSimulation } from '../data/simulations-registry'
import { useProgressStore } from '../store/useProgressStore'

export function Gs8RunPage() {
  const { id = '' } = useParams()
  const entry = getSimulation(id)
  const hydrate = useProgressStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!entry) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p>Simulation not found.</p>
        <Link to="/gs8">Back to GS8 library</Link>
      </div>
    )
  }

  const Sim = entry.component
  return (
    <Suspense
      fallback={
        <div className="route-fallback" role="status">
          Loading {entry.title}…
        </div>
      }
    >
      <Sim />
    </Suspense>
  )
}
