import type { ChangeEvent, ReactNode } from 'react'

export function ControlSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="sim-ctl-section">
      {title ? <p className="sim-ctl-section-title">{title}</p> : null}
      {children}
    </div>
  )
}

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
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  display?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="sim-ctl">
      <span className="sim-ctl-label-row">
        <span className="sim-ctl-label">{label}</span>
        <span className="sim-ctl-value">{display ?? String(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display ?? String(value)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

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
  return (
    <label className="sim-ctl">
      <span className="sim-ctl-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ControlToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="sim-ctl-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

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
