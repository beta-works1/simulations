import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('ecology-scenery')

export const EcologyColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    default: '#e8f2ec',
  }),
  panelFill: 'rgba(255,255,255,0.92)',
  panelStroke: 'rgba(71, 85, 105, 0.28)',
  ink: '#0f172a',
  muted: '#475569',
  accent: '#0d9488',
  accentSoft: '#99f6e4',
  danger: '#dc2626',
  co2: '#f59e0b',
  o2: '#38bdf8',
  producer: '#16a34a',
  herbivore: '#eab308',
  carnivore: '#ef4444',
  decomposer: '#9333ea',
}
