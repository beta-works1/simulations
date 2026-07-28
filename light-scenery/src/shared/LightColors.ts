import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('light-scenery')

/**
 * Ch1 carbon-oxygen + Ch2 nervous parity: cool lab backdrop, dark control panels,
 * teal accent — not warm parchment.
 */
export const LightColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
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
  mother: '#e11d48',
  father: '#2563eb',
  dominant: '#16a34a',
  recessive: '#64748b',
  cellMembrane: '#0ea5e9',
  cytoplasm: 'rgba(14,165,233,0.14)',
  nucleusFill: '#7c3aed',
  nucleolus: '#5b21b6',
  chromatin: 'rgba(124,58,237,0.55)',
  chromosome: '#dc2626',
  chromosomeAlt: '#2563eb',
  centromere: '#f8fafc',
  dnaStrandA: '#0891b2',
  dnaStrandB: '#ea580c',
  basePair: '#f59e0b',
  gene: '#eab308',
  geneGlow: 'rgba(234,179,8,0.28)',
  histone: '#64748b',
  spindle: '#94a3b8',
}
