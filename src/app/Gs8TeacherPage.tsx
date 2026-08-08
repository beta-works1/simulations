import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { simulationsRegistry } from '../data/simulations-registry'
import { useProgressStore } from '../store/useProgressStore'
import './gs8.css'

function exportJson(rows: ReturnType<typeof collectRows>) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  download(blob, `gs8-progress-${Date.now()}.json`)
}

function exportCsv(rows: ReturnType<typeof collectRows>) {
  const header = 'simId,title,unit,completedGuided,quizScore,markedUnderstood,updatedAt'
  const lines = rows.map((r) =>
    [
      r.simId,
      csvEscape(r.title),
      csvEscape(r.unit),
      r.completedGuided,
      r.quizScore ?? '',
      r.markedUnderstood,
      r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
    ].join(','),
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  download(blob, `gs8-progress-${Date.now()}.csv`)
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function collectRows(byId: Record<string, { completedGuidedMode: boolean; quizScore: number | null; markedUnderstood: boolean; updatedAt: number }>) {
  return simulationsRegistry.map((sim) => {
    const p = byId[sim.id]
    return {
      simId: sim.id,
      title: sim.title,
      unit: `Unit ${sim.unitNumber} — ${sim.unitName}`,
      completedGuided: Boolean(p?.completedGuidedMode),
      quizScore: p?.quizScore ?? null,
      markedUnderstood: Boolean(p?.markedUnderstood),
      updatedAt: p?.updatedAt ?? null,
    }
  })
}

/** Offline-first teacher aggregate of local progress (no accounts / no server). */
export function Gs8TeacherPage() {
  const hydrate = useProgressStore((s) => s.hydrate)
  const byId = useProgressStore((s) => s.byId)
  const hydrated = useProgressStore((s) => s.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const rows = useMemo(() => collectRows(byId), [byId])
  const completed = rows.filter((r) => r.markedUnderstood || r.completedGuided).length

  return (
    <div className="gs8-library">
      <header className="gs8-library-hero">
        <p className="gs8-eyebrow">Teacher view · offline</p>
        <h1>Classroom progress (this device)</h1>
        <p>
          Reads the local IndexedDB progress store. Export CSV/JSON to collect results from tablets —
          no login required.
        </p>
        <p>
          <Link to="/gs8">← Library</Link>
          {' · '}
          <button type="button" className="gs8-inline-link" onClick={() => exportCsv(rows)}>
            Export CSV
          </button>
          {' · '}
          <button type="button" className="gs8-inline-link" onClick={() => exportJson(rows)}>
            Export JSON
          </button>
        </p>
        <p>
          {hydrated
            ? `${completed} of ${rows.length} simulations have guided or “understood” progress on this device.`
            : 'Loading progress…'}
        </p>
      </header>

      <div className="gs8-teacher-table-wrap">
        <table className="gs8-teacher-table">
          <thead>
            <tr>
              <th>Simulation</th>
              <th>Unit</th>
              <th>Guided</th>
              <th>Quiz</th>
              <th>Understood</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.simId}>
                <td>{r.title}</td>
                <td>{r.unit}</td>
                <td>{r.completedGuided ? 'Yes' : '—'}</td>
                <td>{r.quizScore == null ? '—' : r.quizScore}</td>
                <td>{r.markedUnderstood ? 'Yes' : '—'}</td>
                <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
