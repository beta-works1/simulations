import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { KeyPointsCard, QuickCheckQuiz } from '../ui'
import { UNIT_TOKENS, unitCssVars, type UnitId } from '../data/unitTokens'
import { useAppStore } from '../store/useAppStore'
import { useProgressStore } from '../store/useProgressStore'
import './shell.css'

export interface GuidedStep {
  id: string
  label: string
  detail: string
}

export interface RecapContent {
  keyPoints: string[]
  quiz: {
    question: string
    choices: string[]
    correctIndex: number
  }
}

export interface SimulationShellProps {
  simId: string
  unitId: UnitId
  title: string
  unitNumber: number
  modes?: string[]
  activeMode?: string
  onModeChange?: (mode: string) => void
  slo: string[]
  bookPage: number
  guidedSteps: GuidedStep[]
  guidedStepIndex: number
  onGuidedStepChange: (index: number) => void
  exploreMode: boolean
  onExploreModeChange: (explore: boolean) => void
  recap: RecapContent
  recapOpen: boolean
  onRecapOpenChange: (open: boolean) => void
  onReset: () => void
  controls: ReactNode
  children: ReactNode
}

function Header({
  unitId,
  unitNumber,
  title,
  slo,
  bookPage,
}: {
  unitId: UnitId
  unitNumber: number
  title: string
  slo: string[]
  bookPage: number
}) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { t } = useTranslation()
  const soundOn = useAppStore((s) => s.soundOn)
  const setSoundOn = useAppStore((s) => s.setSoundOn)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setReducedMotion = useAppStore((s) => s.setReducedMotion)
  const unit = UNIT_TOKENS[unitId]

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }

  return (
    <header className="gs8-header">
      <div className="gs8-header-left">
        <Link to="/gs8" className="gs8-icon-btn" aria-label={t('shell.library')}>
          {t('shell.library')}
        </Link>
        <span className="gs8-badge" aria-hidden>
          {unitNumber}
        </span>
        <div>
          <h1>{title}</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>{unit.name}</p>
        </div>
      </div>
      <div className="gs8-header-right">
        <button type="button" className="gs8-icon-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
          ⛶
        </button>
        <button
          type="button"
          className="gs8-icon-btn"
          aria-expanded={settingsOpen}
          onClick={() => {
            setSettingsOpen((v) => !v)
            setInfoOpen(false)
          }}
        >
          ⚙
        </button>
        <button
          type="button"
          className="gs8-icon-btn"
          aria-expanded={infoOpen}
          onClick={() => {
            setInfoOpen((v) => !v)
            setSettingsOpen(false)
          }}
        >
          ⓘ
        </button>
      </div>
      {infoOpen ? (
        <div className="gs8-popover" role="dialog" aria-label="Simulation info">
          <h3>{t('shell.learningGoals')}</h3>
          <ul>
            {slo.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p style={{ marginTop: '0.65rem' }}>{t('shell.bookPage', { page: bookPage })}</p>
        </div>
      ) : null}
      {settingsOpen ? (
        <div className="gs8-popover" role="dialog" aria-label={t('shell.settings')}>
          <h3>{t('shell.settings')}</h3>
          <label className="gs8-toggle">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => setSoundOn(e.target.checked)}
            />
            <span>{t('shell.sound')}</span>
          </label>
          <label className="gs8-toggle">
            <input
              type="checkbox"
              checked={language === 'ur'}
              onChange={(e) => setLanguage(e.target.checked ? 'ur' : 'en')}
            />
            <span>{t('shell.urdu')}</span>
          </label>
          <label className="gs8-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            <span>{t('shell.reducedMotion')}</span>
          </label>
        </div>
      ) : null}
    </header>
  )
}

export function TabBar({
  modes,
  active,
  onChange,
}: {
  modes: string[]
  active: string
  onChange: (mode: string) => void
}) {
  if (!modes.length) return null
  return (
    <div className="gs8-tabs" role="tablist" aria-label="Simulation modes">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          className={`gs8-tab${active === mode ? ' is-active' : ''}`}
          aria-selected={active === mode}
          onClick={() => onChange(mode)}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}

export function ControlPanel({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <aside className="gs8-controls" aria-label={t('shell.controls')}>
      <h2>{t('shell.controls')}</h2>
      {children}
    </aside>
  )
}

export function BottomBar({
  onReset,
  soundOn,
  onToggleSound,
}: {
  onReset: () => void
  soundOn: boolean
  onToggleSound: () => void
}) {
  const [keyboardHelp, setKeyboardHelp] = useState(false)
  const { t } = useTranslation()
  return (
    <footer className="gs8-bottom">
      <div className="gs8-bottom-actions">
        <Link to="/gs8" className="gs8-icon-btn" aria-label={t('shell.home')}>
          🏠 {t('shell.home')}
        </Link>
        <button type="button" className="gs8-icon-btn" onClick={onReset}>
          ↺ {t('shell.reset')}
        </button>
        <button type="button" className="gs8-icon-btn" onClick={onToggleSound}>
          {soundOn ? `🔊 ${t('shell.soundOn')}` : `🔇 ${t('shell.muted')}`}
        </button>
        <button
          type="button"
          className="gs8-icon-btn"
          onClick={() => setKeyboardHelp((v) => !v)}
          aria-expanded={keyboardHelp}
        >
          ⌨ {t('shell.keyboard')}
        </button>
      </div>
      <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>GS8 · SNC 2022</span>
      {keyboardHelp ? (
        <div className="gs8-popover" style={{ bottom: '3.5rem', top: 'auto', left: '0.75rem', right: 'auto' }}>
          <h3>{t('shell.keyboard')}</h3>
          <p>{t('shell.keyboardHelp')}</p>
        </div>
      ) : null}
    </footer>
  )
}

export function GuidedStepsOverlay({
  steps,
  index,
  exploreMode,
  onIndexChange,
  onExploreModeChange,
}: {
  steps: GuidedStep[]
  index: number
  exploreMode: boolean
  onIndexChange: (i: number) => void
  onExploreModeChange: (v: boolean) => void
}) {
  const current = steps[index]
  const { t } = useTranslation()
  return (
    <div className="gs8-modebar">
      <div className="gs8-steps" aria-label="Guided steps">
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            className={`gs8-step-dot${i < index ? ' is-done' : ''}${i === index ? ' is-current' : ''}`}
            aria-label={`Step ${i + 1}: ${step.label}`}
            aria-current={i === index ? 'step' : undefined}
            onClick={() => onIndexChange(i)}
          />
        ))}
        <p className="gs8-step-label">
          {exploreMode
            ? t('shell.freeExploreHint')
            : current
              ? `${index + 1}. ${current.detail}`
              : ''}
        </p>
      </div>
      <label className="gs8-toggle" style={{ color: 'inherit' }}>
        <input
          type="checkbox"
          checked={exploreMode}
          onChange={(e) => onExploreModeChange(e.target.checked)}
        />
        <span>{t('shell.freeExplore')}</span>
      </label>
    </div>
  )
}

export function RecapDrawer({
  open,
  content,
  onClose,
  onUnderstood,
  onScored,
}: {
  open: boolean
  content: RecapContent
  onClose: () => void
  onUnderstood: () => void
  onScored: (score: number) => void
}) {
  const titleId = useId()
  const { t } = useTranslation()
  if (!open) return null
  return (
    <div className="gs8-recap" role="dialog" aria-labelledby={titleId}>
      <h2 id={titleId}>{t('shell.recap')}</h2>
      <KeyPointsCard points={content.keyPoints} />
      <div style={{ marginTop: '0.85rem' }}>
        <QuickCheckQuiz {...content.quiz} onScored={onScored} />
      </div>
      <div className="gs8-recap-actions">
        <button type="button" className="gs8-btn" onClick={onUnderstood}>
          {t('shell.markUnderstood')}
        </button>
        <button type="button" className="gs8-icon-btn" style={{ color: '#152033', background: '#e2e8f0' }} onClick={onClose}>
          {t('shell.close')}
        </button>
      </div>
    </div>
  )
}

export function SimulationShell(props: SimulationShellProps) {
  const soundOn = useAppStore((s) => s.soundOn)
  const setSoundOn = useAppStore((s) => s.setSoundOn)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const markGuidedComplete = useProgressStore((s) => s.markGuidedComplete)
  const markUnderstood = useProgressStore((s) => s.markUnderstood)
  const setQuizScore = useProgressStore((s) => s.setQuizScore)
  const hydrate = useProgressStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (
      !props.exploreMode &&
      props.guidedStepIndex >= props.guidedSteps.length - 1 &&
      props.guidedSteps.length > 0
    ) {
      void markGuidedComplete(props.simId)
    }
  }, [
    props.exploreMode,
    props.guidedStepIndex,
    props.guidedSteps.length,
    props.simId,
    markGuidedComplete,
  ])

  const vars = unitCssVars(props.unitId)

  return (
    <div
      className="gs8-shell"
      style={vars as CSSProperties}
      data-testid="simulation-shell"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <Header
        unitId={props.unitId}
        unitNumber={props.unitNumber}
        title={props.title}
        slo={props.slo}
        bookPage={props.bookPage}
      />
      {props.modes?.length ? (
        <TabBar
          modes={props.modes}
          active={props.activeMode ?? props.modes[0]}
          onChange={(m) => props.onModeChange?.(m)}
        />
      ) : null}
      <GuidedStepsOverlay
        steps={props.guidedSteps}
        index={props.guidedStepIndex}
        exploreMode={props.exploreMode}
        onIndexChange={props.onGuidedStepChange}
        onExploreModeChange={props.onExploreModeChange}
      />
      <div className="gs8-body">
        <div className="gs8-canvas-slot">{props.children}</div>
        <ControlPanel>{props.controls}</ControlPanel>
        <RecapDrawer
          open={props.recapOpen}
          content={props.recap}
          onClose={() => props.onRecapOpenChange(false)}
          onUnderstood={() => {
            void markUnderstood(props.simId)
            props.onRecapOpenChange(false)
          }}
          onScored={(score) => {
            void setQuizScore(props.simId, score)
          }}
        />
      </div>
      <BottomBar
        onReset={props.onReset}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(!soundOn)}
      />
    </div>
  )
}
