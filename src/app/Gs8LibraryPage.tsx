import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { simulationsRegistry } from '../data/simulations-registry'
import { UNIT_TOKENS, type UnitId } from '../data/unitTokens'
import { useAppStore } from '../store/useAppStore'
import { useProgressStore } from '../store/useProgressStore'
import './gs8.css'

export function Gs8LibraryPage() {
  const { t } = useTranslation()
  const hydrate = useProgressStore((s) => s.hydrate)
  const byId = useProgressStore((s) => s.byId)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const byUnit = new Map<UnitId, typeof simulationsRegistry>()
  for (const sim of simulationsRegistry) {
    const list = byUnit.get(sim.unitId) ?? []
    list.push(sim)
    byUnit.set(sim.unitId, list)
  }

  return (
    <div className="gs8-library">
      <header className="gs8-library-hero">
        <p className="gs8-eyebrow">General Science 8 · SNC 2022</p>
        <h1>{t('shell.libraryTitle')}</h1>
        <p>{t('shell.libraryBlurb')}</p>
        <p>
          <Link to="/">{t('shell.backToCatalog')}</Link>
          {' · '}
          <Link to="/gs8/teacher">{t('shell.teacherView')}</Link>
          {' · '}
          <button
            type="button"
            className="gs8-inline-link"
            onClick={() => setLanguage(language === 'ur' ? 'en' : 'ur')}
          >
            {language === 'ur' ? 'English' : t('shell.urdu')}
          </button>
        </p>
      </header>

      {[...byUnit.entries()].map(([unitId, sims]) => {
        const unit = UNIT_TOKENS[unitId]
        return (
          <section key={unitId} className="gs8-unit-block">
            <h2 style={{ color: unit.accentInk }}>
              <span style={{ background: unit.accent }} />
              Unit {sims[0].unitNumber} — {unit.name}
            </h2>
            <div className="gs8-card-grid">
              {sims.map((sim) => {
                const progress = byId[sim.id]
                return (
                  <Link
                    key={sim.id}
                    to={`/gs8/run/${sim.id}`}
                    className="gs8-card"
                    style={{
                      borderColor: unit.accent,
                      background: unit.accentSoft,
                    }}
                  >
                    <strong>{sim.title}</strong>
                    <span>
                      p.{sim.bookPage || '—'} · {sim.priority}
                    </span>
                    {progress?.markedUnderstood ? (
                      <em className="gs8-done">Understood</em>
                    ) : progress?.completedGuidedMode ? (
                      <em className="gs8-done">Guided done</em>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
