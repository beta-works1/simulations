import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SimulationGrid } from '../components/SimulationGrid'
import { SimulationGridSkeleton } from '../components/Skeleton'
import {
  SUBJECT_LABELS,
  SUBJECT_ORDER,
  simulations,
  type Subject,
} from '../data/simulations'
import './SimulationsPage.css'

function matchesQuery(haystack: string, query: string): boolean {
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return true
  const text = haystack.toLowerCase()
  return tokens.every((token) => text.includes(token))
}

export function SimulationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
  const [loading, setLoading] = useState(true)

  const activeSubject = (searchParams.get('subject') as Subject | 'all' | null) ?? 'all'

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    const id = window.setTimeout(() => setLoading(false), 160)
    return () => window.clearTimeout(id)
  }, [activeSubject, searchQuery])

  const filtered = useMemo(() => {
    return simulations.filter((sim) => {
      const matchesSubject = activeSubject === 'all' || sim.subject === activeSubject
      const haystack = [
        sim.title,
        sim.description,
        SUBJECT_LABELS[sim.subject],
        ...sim.keywords,
        ...sim.learningGoals,
      ].join(' ')
      return matchesSubject && matchesQuery(haystack, searchQuery)
    })
  }, [activeSubject, searchQuery])

  const setSubject = (subject: Subject | 'all') => {
    const params = new URLSearchParams(searchParams)
    if (subject === 'all') params.delete('subject')
    else params.set('subject', subject)
    setSearchParams(params, { replace: true })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    const params = new URLSearchParams(searchParams)
    if (value.trim()) params.set('q', value.trim())
    else params.delete('q')
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchParams({}, { replace: true })
  }

  const subjectTitle =
    activeSubject === 'all' ? 'All Simulations' : SUBJECT_LABELS[activeSubject]

  return (
    <div className="simulations-page page-content">
      <PageMeta
        title={subjectTitle}
        description={`Browse ${subjectTitle.toLowerCase()} on SimLab — free interactive science experiment simulations.`}
        path="/simulations"
      />

      <header className="simulations-header">
        <h1>{subjectTitle}</h1>
        <p>
          Explore interactive science experiment simulations. Filter by subject, search by topic,
          then open a simulation to learn by discovery — the same workflow as PhET.
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
            enterKeyHint="search"
          />
        </div>

        <div className="filter-group">
          <p className="filter-label" id="subject-filter-label">
            Subject
          </p>
          <div className="filter-chips" role="group" aria-labelledby="subject-filter-label">
            <button
              type="button"
              className={activeSubject === 'all' ? 'active' : ''}
              aria-pressed={activeSubject === 'all'}
              onClick={() => setSubject('all')}
            >
              All Sims
            </button>
            {SUBJECT_ORDER.map((subject) => (
              <button
                key={subject}
                type="button"
                className={activeSubject === subject ? 'active' : ''}
                aria-pressed={activeSubject === subject}
                onClick={() => setSubject(subject)}
              >
                {SUBJECT_LABELS[subject]}
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
          <p>Nothing matches your search or subject filter. Try another keyword or subject.</p>
          <button type="button" className="btn btn-primary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
