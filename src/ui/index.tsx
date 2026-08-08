import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import './ui.css'

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  unit?: string
}) {
  return (
    <label className="gs8-slider">
      <span className="gs8-slider-label">
        {label}
        <strong>
          {value}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="gs8-toggle">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="gs8-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function ReadoutBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="gs8-readout" aria-live="polite">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ActivityCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="gs8-activity" aria-label={title}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  )
}

export function HotspotLabel({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`gs8-hotspot${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function StepperScrubber({
  stageIndex,
  stageLabels,
  playing,
  onPlayPause,
  onStep,
  onSelect,
}: {
  stageIndex: number
  stageLabels: string[]
  playing: boolean
  onPlayPause: () => void
  onStep: (dir: -1 | 1) => void
  onSelect: (index: number) => void
}) {
  return (
    <div className="gs8-stepper">
      <div className="gs8-stepper-transport">
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous stage">
          ‹
        </button>
        <button type="button" onClick={onPlayPause} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={() => onStep(1)} aria-label="Next stage">
          ›
        </button>
      </div>
      <div className="gs8-stepper-markers" role="tablist" aria-label="Stages">
        {stageLabels.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === stageIndex}
            className={i === stageIndex ? 'is-active' : undefined}
            onClick={() => onSelect(i)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ClassifyDropZone({
  label,
  onDropId,
  children,
}: {
  label: string
  onDropId: (id: string) => void
  children?: ReactNode
}) {
  return (
    <div
      className="gs8-dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/gs8-token')
        if (id) onDropId(id)
      }}
    >
      <p>{label}</p>
      {children}
    </div>
  )
}

export function DraggableToken({
  id,
  label,
  x,
  y,
  onMove,
}: {
  id: string
  label: string
  x: number
  y: number
  onMove: (x: number, y: number) => void
}) {
  return (
    <button
      type="button"
      className="gs8-token"
      style={{ left: x, top: y }}
      draggable
      aria-label={label}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/gs8-token', id)
      }}
      onPointerDown={(e) => {
        const target = e.currentTarget.parentElement
        if (!target) return
        const rect = target.getBoundingClientRect()
        const move = (ev: PointerEvent) => {
          onMove(ev.clientX - rect.left - 24, ev.clientY - rect.top - 24)
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
      }}
    >
      {label}
    </button>
  )
}

export function KeyPointsCard({ points }: { points: string[] }) {
  return (
    <div className="gs8-keypoints">
      <h3>Key Points</h3>
      <ul>
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

export function QuickCheckQuiz({
  question,
  choices,
  correctIndex,
  onScored,
}: {
  question: string
  choices: string[]
  correctIndex: number
  onScored: (score: number) => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <fieldset className="gs8-quiz">
      <legend>{question}</legend>
      {choices.map((c, i) => {
        const isPick = picked === i
        const isCorrect = i === correctIndex
        return (
          <button
            key={c}
            type="button"
            className={
              picked == null
                ? undefined
                : isCorrect
                  ? 'is-correct'
                  : isPick
                    ? 'is-wrong'
                    : undefined
            }
            aria-pressed={isPick}
            onClick={() => {
              setPicked(i)
              onScored(i === correctIndex ? 1 : 0)
            }}
          >
            {c}
            {picked != null && isCorrect ? ' ✓' : null}
            {isPick && !isCorrect ? ' ✗' : null}
          </button>
        )
      })}
      {picked != null ? (
        <p className="gs8-quiz-feedback" role="status" aria-live="polite">
          {picked === correctIndex ? 'Correct' : 'Try again — look for the ✓ mark'}
        </p>
      ) : null}
    </fieldset>
  )
}

export function UiButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="gs8-btn" {...props} />
}

export function UiNumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="gs8-input" {...props} />
}
