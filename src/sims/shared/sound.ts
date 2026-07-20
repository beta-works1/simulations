/**
 * Web Audio UI sounds for SimLab shared controls.
 * Fire-and-forget oscillator tones — no external assets.
 * Sounds only play from direct user gestures (never on mount / sim loop).
 */

const MUTE_KEY = 'simlab-sound-muted'
const SLIDER_TICK_MS = 90

let ctx: AudioContext | null = null
let muted = readMuted()
let lastSliderTickAt = 0
const listeners = new Set<(muted: boolean) => void>()

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {})
  }
  return ctx
}

function tone(
  freq: number,
  durationSec: number,
  opts?: { type?: OscillatorType; gain?: number; slideTo?: number },
) {
  if (muted) return
  const audio = ensureCtx()
  if (!audio) return

  const now = audio.currentTime
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = opts?.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, now)
  if (opts?.slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slideTo), now + durationSec)
  }

  const peak = opts?.gain ?? 0.08
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(now)
  osc.stop(now + durationSec + 0.02)
}

/** Short crisp click for buttons (Reset, Play/Pause, Step). */
export function playClick() {
  tone(720, 0.07, { type: 'triangle', gain: 0.07, slideTo: 420 })
}

/** Two-tone blip for toggles; pitch differs for on vs off. */
export function playToggle(on: boolean) {
  if (muted) return
  const audio = ensureCtx()
  if (!audio) return
  const now = audio.currentTime
  const f1 = on ? 520 : 380
  const f2 = on ? 780 : 280

  const playOne = (freq: number, start: number, dur: number) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  playOne(f1, now, 0.05)
  playOne(f2, now + 0.055, 0.06)
}

/** Soft throttled tick for discrete slider step changes. */
export function playSliderTick() {
  const t = performance.now()
  if (t - lastSliderTickAt < SLIDER_TICK_MS) return
  lastSliderTickAt = t
  tone(880, 0.035, { type: 'sine', gain: 0.035 })
}

/** Richer chime for meaningful preset actions. */
export function playChime() {
  if (muted) return
  const audio = ensureCtx()
  if (!audio) return
  const now = audio.currentTime
  const notes = [523.25, 659.25, 783.99] // C5 E5 G5
  notes.forEach((freq, i) => {
    const start = now + i * 0.055
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(start)
    osc.stop(start + 0.16)
  })
}

export function isSoundMuted(): boolean {
  return muted
}

export function setSoundMuted(next: boolean) {
  muted = next
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((fn) => fn(muted))
}

export function toggleSoundMuted(): boolean {
  setSoundMuted(!muted)
  return muted
}

/** Subscribe to mute changes (for the chrome mute button). */
export function subscribeSoundMuted(fn: (muted: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
