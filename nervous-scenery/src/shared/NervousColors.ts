import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('nervous-scenery')

export const NervousColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    default: '#f3eef8',
  }),
  panelFill: 'rgba(255,255,255,0.94)',
  panelStroke: 'rgba(71, 85, 105, 0.28)',
  ink: '#0f172a',
  muted: '#475569',
  accent: '#7c3aed',
  accentSoft: '#ddd6fe',
  receptor: '#e67e22',
  effector: '#27ae60',
  spine: '#2f6fed',
  signal: '#f1c40f',
  myelin: '#f5b041',
  axon: '#a9cce3',
  soma: '#5dade2',
}
