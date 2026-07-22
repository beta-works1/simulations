/**
 * Shared PhET-style control library for SimLab.
 * Prefer these in every sim sidebar instead of one-off <input> markup.
 *
 * Aliases (Slider, Checkbox, ControlPanel, …) match common PhET naming.
 * UI sounds play automatically via src/sims/shared/sound.ts.
 */
import type { ButtonHTMLAttributes, ChangeEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { playChime, playClick, playSliderTick, playToggle } from './sound'
import { Z_INDEX } from './zIndex'

/** Only one InfoTooltip popover open app-wide. */
let openInfoId: string | null = null
const infoListeners = new Set<(id: string | null) => void>()

function setOpenInfoId(id: string | null) {
  openInfoId = id
  infoListeners.forEach((fn) => fn(id))
}

function subscribeOpenInfo(fn: (id: string | null) => void) {
  infoListeners.add(fn)
  return () => {
    infoListeners.delete(fn)
  }
}

export function ControlSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="sim-ctl-section">
      {title ? <p className="sim-ctl-section-title">{title}</p> : null}
      {children}
    </div>
  )
}

/** PhET-style panel container alias. */
export const ControlPanel = ControlSection

export function ControlHint({ children }: { children: ReactNode }) {
  return <p className="sim-ctl-hint">{children}</p>
}

export function ControlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  display?: string
  /** Unit shown after the numeric readout (e.g. "°", "N"). */
  unit?: string
  onChange: (value: number) => void
}) {
  const id = useId()
  const shown = display ?? `${value}${unit ?? ''}`

  const commit = (next: number) => {
    if (next === value) return
    playSliderTick()
    onChange(next)
  }

  const nudge = (dir: -1 | 1) => {
    const next = Math.min(max, Math.max(min, value + dir * step))
    commit(Number(next.toFixed(6)))
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      nudge(-1)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      nudge(1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      commit(min)
    } else if (e.key === 'End') {
      e.preventDefault()
      commit(max)
    }
  }

  return (
    <label className="sim-ctl" htmlFor={id}>
      <span className="sim-ctl-label-row">
        <span className="sim-ctl-label">{label}</span>
        <span className="sim-ctl-value" aria-live="polite">
          {shown}
        </span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={shown}
        aria-label={label}
        onKeyDown={onKeyDown}
        onChange={(e: ChangeEvent<HTMLInputElement>) => commit(Number(e.target.value))}
      />
    </label>
  )
}

/** PhET naming alias. */
export const Slider = ControlSlider

export function ControlSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <label className="sim-ctl" htmlFor={id}>
      <span className="sim-ctl-label">{label}</span>
      <select
        id={id}
        value={value}
        aria-label={label}
        onChange={(e) => {
          playClick()
          onChange(e.target.value)
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ControlRadioGroup({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const groupId = useId()
  return (
    <fieldset className="sim-ctl-fieldset" aria-labelledby={groupId}>
      <legend id={groupId} className="sim-ctl-label">
        {label}
      </legend>
      <div className="sim-ctl-radio-group" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const optId = `${name}-${o.value}`
          return (
            <label key={o.value} className="sim-ctl-radio" htmlFor={optId}>
              <input
                id={optId}
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                onChange={() => {
                  playToggle(true)
                  onChange(o.value)
                }}
              />
              <span>{o.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** PhET naming alias. */
export const RadioGroup = ControlRadioGroup

export function ControlToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <label className="sim-ctl-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(e) => {
          playToggle(e.target.checked)
          onChange(e.target.checked)
        }}
      />
      <span>{label}</span>
    </label>
  )
}

/** PhET naming aliases. */
export const Checkbox = ControlToggle
export const ToggleSwitch = ControlToggle

export function ControlStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sim-ctl-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ControlStats({ children }: { children: ReactNode }) {
  return <div className="sim-ctl-stats">{children}</div>
}

export function ControlStack({ children }: { children: ReactNode }) {
  return <div className="sim-ctl-stack">{children}</div>
}

/** Small “i” legend / instructions popover (PhET-style) — portaled above all sim chrome. */
export function InfoTooltip({
  title = 'About this simulation',
  children,
}: {
  title?: string
  children: ReactNode
}) {
  const tipId = useId()
  const [activeId, setActiveId] = useState<string | null>(() => openInfoId)
  const open = activeId === tipId

  useEffect(() => subscribeOpenInfo(setActiveId), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpenInfoId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => {
    playClick()
    setOpenInfoId(null)
  }

  const toggle = () => {
    playClick()
    setOpenInfoId(open ? null : tipId)
  }

  return (
    <div className="sim-info-tooltip">
      <button
        type="button"
        className="sim-info-tooltip-btn"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label={title}
        onClick={toggle}
      >
        i
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="sim-info-popover-root" style={{ zIndex: Z_INDEX.popover }}>
              <button
                type="button"
                className="sim-info-popover-backdrop"
                aria-label="Close info"
                onClick={close}
              />
              <div
                id={tipId}
                className="sim-info-popover-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${tipId}-title`}
              >
                <p id={`${tipId}-title`} className="sim-info-tooltip-title">
                  {title}
                </p>
                <div className="sim-info-tooltip-body">{children}</div>
                <button type="button" className="sim-shell-btn" onClick={close}>
                  Close
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export function PlayPauseButton({
  running,
  onToggle,
}: {
  running: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`sim-shell-btn${running ? ' is-active' : ''}`}
      onClick={() => {
        playClick()
        onToggle()
      }}
      aria-label={running ? 'Pause' : 'Play'}
    >
      {running ? 'Pause' : 'Play'}
    </button>
  )
}

export function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      className="sim-shell-btn"
      onClick={() => {
        playClick()
        onReset()
      }}
      aria-label="Reset simulation"
    >
      Reset
    </button>
  )
}

/** Combined play/pause + optional step (framework transport). */
export function PlayPauseStepButton({
  running,
  onToggle,
  onStep,
}: {
  running: boolean
  onToggle: () => void
  onStep?: () => void
}) {
  return (
    <ControlStack>
      <PlayPauseButton running={running} onToggle={onToggle} />
      {onStep ? (
        <button
          type="button"
          className="sim-shell-btn"
          onClick={() => {
            playClick()
            onStep()
          }}
          aria-label="Step once"
        >
          Step
        </button>
      ) : null}
    </ControlStack>
  )
}

type PresetButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  children: ReactNode
  /** `chime` for meaningful presets; `click` for ordinary actions. */
  sound?: 'chime' | 'click'
  primary?: boolean
}

/**
 * Shared action / preset button — plays click or chime so sims get sound for free.
 */
export function PresetButton({
  children,
  sound = 'chime',
  primary = true,
  className,
  onClick,
  ...rest
}: PresetButtonProps) {
  return (
    <button
      type="button"
      className={`sim-shell-btn${primary ? ' is-primary' : ''}${className ? ` ${className}` : ''}`}
      onClick={(e) => {
        if (sound === 'chime') playChime()
        else playClick()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Generic shared button alias. */
export const Button = PresetButton
