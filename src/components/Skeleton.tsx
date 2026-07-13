import './Skeleton.css'

export function CardSkeleton() {
  return (
    <div className="simulation-list-item skeleton-card" aria-hidden="true">
      <div className="skeleton-thumb shimmer" />
      <div className="skeleton-line shimmer" />
      <div className="skeleton-line short shimmer" />
    </div>
  )
}

export function SimulationGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="simulation-grid-section" aria-busy="true" aria-label="Loading simulations">
      <div className="simulation-grid">
        {Array.from({ length: count }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function ViewerSkeleton() {
  return (
    <div className="viewer-skeleton shimmer" aria-busy="true" aria-label="Loading simulation">
      <span className="viewer-skeleton-label">Preparing simulation…</span>
    </div>
  )
}
