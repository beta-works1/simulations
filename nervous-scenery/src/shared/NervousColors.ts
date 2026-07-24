import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('nervous-scenery')

export const NervousColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    // Cool clinical lab — closer to ecology's intentional palette (not flat purple wash).
    default: '#dce7f0',
  }),
  panelFill: 'rgba(255,255,255,0.94)',
  panelStroke: 'rgba(71, 85, 105, 0.28)',
  /** Dark control panel fill (Ch1 carbon-oxygen parity). */
  panelDark: 'rgba(11, 22, 40, 0.94)',
  panelDarkStroke: 'rgba(124, 160, 190, 0.35)',
  ink: '#0f172a',
  muted: '#475569',
  panelMuted: '#94a3b8',
  panelText: '#ecf0f1',
  accent: '#0d9488',
  accentSoft: '#99f6e4',
  receptor: '#e67e22',
  effector: '#27ae60',
  spine: '#2f6fed',
  signal: '#f1c40f',
  myelin: '#f5b041',
  axon: '#a9cce3',
  soma: '#5dade2',
}
