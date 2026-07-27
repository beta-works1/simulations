import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('ph-ecology')

/** Ch2/Ch3 SoftButton kit theme (carbon dark + teal). */
export const SimTheme = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    default: '#dce7f0',
  }),
  panelFill: 'rgba(255,255,255,0.94)',
  panelStroke: 'rgba(71, 85, 105, 0.28)',
  panelDark: 'rgba(11, 22, 40, 0.94)',
  panelDarkStroke: 'rgba(124, 160, 190, 0.35)',
  ink: '#0f172a',
  muted: '#475569',
  panelMuted: '#94a3b8',
  panelText: '#ecf0f1',
  accent: '#0d9488',
  accentSoft: '#99f6e4',
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}
