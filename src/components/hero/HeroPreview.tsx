import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useReducedMotion } from 'motion/react'
import { PreviewScene2D } from './PreviewScene2D'
import { previewCaption, previewState } from './previewModel'
import './HeroPreview.css'

const PreviewScene3D = lazy(() => import('./PreviewScene3D'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}

/**
 * Three.js costs roughly a second of scripting on a throttled phone, which is a
 * bad trade for a decorative element on a small screen — those visitors get the
 * animated 2D scene instead. Same call for data-saver and low-core devices.
 */
function shouldLoad3D() {
  if (!supportsWebGL()) return false
  if (!window.matchMedia('(min-width: 900px)').matches) return false
  if (window.matchMedia('(pointer: coarse)').matches) return false
  if ((navigator.hardwareConcurrency ?? 8) < 4) return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  return true
}

function whenIdle(fn: () => void) {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(fn, { timeout: 1200 })
    return
  }
  window.setTimeout(fn, 300)
}

export interface HeroPreviewProps {
  /** Where "open the real thing" points — the actual Greenhouse Effect sim. */
  simHref: string
  simLabel: string
}

export function HeroPreview({ simHref, simLabel }: HeroPreviewProps) {
  const reduce = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)

  const [co2, setCo2] = useState(0.32)
  const [use3D, setUse3D] = useState(false)
  const [active, setActive] = useState(true)
  const [compact, setCompact] = useState(false)

  // Refs let the render loop read live values without re-rendering React on drag.
  const co2Ref = useRef(co2)
  const spinRef = useRef(0)
  const tiltRef = useRef(0)
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null)

  const { temp, delta, trapped, escaping } = previewState(co2)

  useEffect(() => {
    co2Ref.current = co2
  }, [co2])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Load the WebGL bundle only after the hero is in view and the page is idle.
  useEffect(() => {
    if (reduce || !shouldLoad3D()) return
    const el = stageRef.current
    if (!el) return

    let cancelled = false
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        setActive(entry.isIntersecting)
        if (entry.isIntersecting && !cancelled) {
          whenIdle(() => {
            if (!cancelled) setUse3D(true)
          })
        }
      },
      { rootMargin: '160px' },
    )
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [reduce])

  useEffect(() => {
    const onVisibility = () => setActive(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!use3D) return
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [use3D])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    spinRef.current += (event.clientX - drag.x) * 0.006
    tiltRef.current = Math.max(-0.5, Math.min(0.5, tiltRef.current + (event.clientY - drag.y) * 0.003))
    drag.x = event.clientX
    drag.y = event.clientY
  }, [])

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id === event.pointerId) dragRef.current = null
  }, [])

  return (
    <figure className="hero-preview">
      <div className="preview-frame">
        <div className="preview-topbar">
          <span className="preview-badge">
            <span className="preview-badge-dot" aria-hidden="true" />
            Live preview
          </span>
          <span className="preview-source">Grade 8 · Ch 1 Ecology</span>
        </div>

        <div
          ref={stageRef}
          className={`preview-stage${use3D ? ' is-3d' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="preview-sun" aria-hidden="true">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <g stroke="#facc15" strokeWidth="4" strokeLinecap="round" opacity="0.75">
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2
                  return (
                    <line
                      key={i}
                      x1={60 + Math.cos(a) * 34}
                      y1={60 + Math.sin(a) * 34}
                      x2={60 + Math.cos(a) * 50}
                      y2={60 + Math.sin(a) * 50}
                    />
                  )
                })}
              </g>
              <circle cx="60" cy="60" r="26" fill="#fbbf24" />
              <circle cx="52" cy="52" r="9" fill="#fde68a" opacity="0.8" />
            </svg>
          </span>

          <div className="preview-scene">
            {use3D ? (
              <Suspense fallback={<PreviewScene2D co2={co2} animated={false} />}>
                <PreviewScene3D
                  co2Ref={co2Ref}
                  spinRef={spinRef}
                  tiltRef={tiltRef}
                  active={active}
                  compact={compact}
                />
              </Suspense>
            ) : (
              <PreviewScene2D co2={co2} animated={!reduce} />
            )}
          </div>

          <p className="preview-readout" aria-live="polite">
            <span className="preview-readout-value">{temp.toFixed(1)}&thinsp;°C</span>
            <span className="preview-readout-label">
              surface{delta > 0.05 ? ` · +${delta.toFixed(1)}°` : ''}
            </span>
          </p>

          {use3D && !compact ? (
            <p className="preview-drag-hint" aria-hidden="true">
              drag to spin
            </p>
          ) : null}
        </div>

        <div className="preview-controls">
          <label className="preview-slider">
            <span className="preview-slider-label">Greenhouse gas in the air</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={co2}
              onChange={(e) => setCo2(Number(e.target.value))}
              aria-describedby="preview-caption"
            />
            <span className="preview-slider-scale" aria-hidden="true">
              <span>thin</span>
              <span>thick</span>
            </span>
          </label>

          <div className="preview-meters">
            <div className="preview-meter">
              <span className="preview-meter-head">
                <span>Heat escaping</span>
                <b>{Math.round(escaping * 100)}%</b>
              </span>
              <span className="preview-meter-track">
                <span
                  className="preview-meter-fill is-escape"
                  style={{ width: `${escaping * 100}%` }}
                />
              </span>
            </div>
            <div className="preview-meter">
              <span className="preview-meter-head">
                <span>Heat trapped</span>
                <b>{Math.round(trapped * 100)}%</b>
              </span>
              <span className="preview-meter-track">
                <span
                  className="preview-meter-fill is-trapped"
                  style={{ width: `${trapped * 100}%` }}
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="preview-caption" id="preview-caption">
        <span className="preview-caption-now">{previewCaption(co2)}</span>
        <a className="preview-open" href={simHref} target="_blank" rel="noopener noreferrer">
          Open {simLabel}
          <span aria-hidden="true"> ↗</span>
        </a>
      </figcaption>
    </figure>
  )
}
