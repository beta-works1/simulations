import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { SimulationGridSkeleton } from '../components/Skeleton'
import {
  GRADE_LABELS,
  SUBJECT_LABELS,
  simulations,
  type GradeLevel,
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

const grades: (GradeLevel | 'all')[] = ['all', '6-8', '9-10', '11-12']

export function SimulationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
  const [loading, setLoading] = useState(true)

  const activeSubject = (searchParams.get('subject') as Subject | 'all' | null) ?? 'all'
  const activeGrade = (searchParams.get('grade') as GradeLevel | 'all' | null) ?? 'all'

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  // Brief skeleton so layout and loading UX are exercised (data is local/static)
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 280)
    return () => window.clearTimeout(id)
  }, [])

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return simulations.filter((sim) => {
      const matchesSubject = activeSubject === 'all' || sim.subject === activeSubject
      const matchesGrade = activeGrade === 'all' || sim.grades.includes(activeGrade)
      const haystack = [
        sim.title,
        sim.description,
        SUBJECT_LABELS[sim.subject],
        ...sim.keywords,
        ...sim.learningGoals,
        ...sim.grades.map((g) => GRADE_LABELS[g]),
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      return matchesSubject && matchesGrade && matchesSearch
    })
  }, [activeSubject, activeGrade, searchQuery])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    if (key !== 'q') {
      // keep q in sync from controlled input on next search effect; also write live
    }
    setSearchParams(params, { replace: true })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    const params = new URLSearchParams(searchParams)
    if (value.trim()) {
      params.set('q', value.trim())
    } else {
      params.delete('q')
    }
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="simulations-page page-content">
      <PageMeta
        title="Browse Simulations"
        description="Search and filter free SimLab science and math simulations by subject and Punjab SNC grade level."
        path="/simulations"
      />

      <header className="simulations-header">
        <h1>Simulations</h1>
        <p>
          Browse free interactive simulations aligned with the Punjab Student Learning Outcomes
          (SNC). Filter by subject or grade, then open a sim to explore.
        </p>
      </header>

      <div className="simulations-filters">
        <div className="filter-search">
          <label htmlFor="sim-search" className="screen-reader-only">
            Search simulations
          </label>
          <input
            id="sim-search"
            type="search"
            placeholder="Search by title or keyword…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="filter-group">
          <p className="filter-label" id="subject-filter-label">
            Subject
          </p>
          <div
            className="filter-chips"
            role="group"
            aria-labelledby="subject-filter-label"
          >
            {subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                className={activeSubject === subject ? 'active' : ''}
                aria-pressed={activeSubject === subject}
                onClick={() => updateParam('subject', subject)}
              >
                {subject === 'all' ? 'All subjects' : SUBJECT_LABELS[subject]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <p className="filter-label" id="grade-filter-label">
            Grade level (Punjab SNC)
          </p>
          <div className="filter-chips" role="group" aria-labelledby="grade-filter-label">
            {grades.map((grade) => (
              <button
                key={grade}
                type="button"
                className={activeGrade === grade ? 'active' : ''}
                aria-pressed={activeGrade === grade}
                onClick={() => updateParam('grade', grade)}
              >
                {grade === 'all' ? 'All grades' : GRADE_LABELS[grade]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="results-count" aria-live="polite">
        {loading
          ? 'Loading…'
          : `${filtered.length} simulation${filtered.length !== 1 ? 's' : ''} found`}
      </p>

      {loading ? (
        <SimulationGridSkeleton count={8} />
      ) : filtered.length > 0 ? (
        <SimulationGrid items={filtered} />
      ) : (
        <div className="no-results" role="status">
          <h2>No simulations found</h2>
          <p>
            Nothing matches your search or filters. Try a different keyword, subject, or grade
            level.
          </p>
          <button type="button" className="btn btn-primary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
