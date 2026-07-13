import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SimulationGrid } from '../components/SimulationGrid'
import {
  simulations,
  SUBJECT_LABELS,
  type Subject,
} from '../data/simulations'
import './SimulationsPage.css'

const subjects: (Subject | 'all')[] = [
  'all',
  'physics',
  'chemistry',
  'biology',
  'earth-and-space',
  'math-and-statistics',
]

export function SimulationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')

  const activeSubject = (searchParams.get('subject') as Subject | null) ?? 'all'

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const filtered = useMemo(() => {
    return simulations.filter((sim) => {
      const matchesSubject =
        activeSubject === 'all' || sim.subject === activeSubject
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        sim.title.toLowerCase().includes(query) ||
        sim.description.toLowerCase().includes(query) ||
        SUBJECT_LABELS[sim.subject].toLowerCase().includes(query)
      return matchesSubject && matchesSearch
    })
  }, [activeSubject, searchQuery])

  const handleSubjectChange = (subject: Subject | 'all') => {
    const params = new URLSearchParams(searchParams)
    if (subject === 'all') {
      params.delete('subject')
    } else {
      params.set('subject', subject)
    }
    setSearchParams(params)
  }

  return (
    <div className="simulations-page page-content">
      <div className="simulations-header">
        <h1>Simulations</h1>
        <p>
          Browse our collection of free interactive simulations for physics, chemistry,
          biology, earth science, and math.
        </p>
      </div>

      <div className="simulations-filters">
        <div className="filter-search">
          <input
            type="search"
            placeholder="Search simulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search simulations"
          />
        </div>

        <div className="filter-subjects" role="tablist" aria-label="Filter by subject">
          {subjects.map((subject) => (
            <button
              key={subject}
              type="button"
              role="tab"
              aria-selected={activeSubject === subject}
              className={activeSubject === subject ? 'active' : ''}
              onClick={() => handleSubjectChange(subject)}
            >
              {subject === 'all' ? 'All Sims' : SUBJECT_LABELS[subject]}
            </button>
          ))}
        </div>
      </div>

      <p className="results-count">
        {filtered.length} simulation{filtered.length !== 1 ? 's' : ''} found
      </p>

      {filtered.length > 0 ? (
        <SimulationGrid items={filtered} />
      ) : (
        <div className="no-results">
          <p>No simulations match your search. Try a different filter or search term.</p>
        </div>
      )}
    </div>
  )
}
