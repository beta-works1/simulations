import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('heredity-scenery')

export const HeredityColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    // Warm genetics-lab parchment — distinct from ecology's cool green and nervous's clinical blue.
    default: '#f3ead4',
  }),
  panelFill: 'rgba(255,255,255,0.94)',
  panelStroke: 'rgba(120, 95, 60, 0.28)',
  /** Dark control panel fill (Ch1 carbon-oxygen parity). */
  panelDark: 'rgba(36, 24, 12, 0.94)',
  panelDarkStroke: 'rgba(217, 180, 120, 0.32)',
  ink: '#2b1d0e',
  muted: '#6b5637',
  panelMuted: '#c9b28a',
  panelText: '#f5ecd7',
  accent: '#f39c12',
  accentSoft: '#fde9c8',
  /** Axis accent colors for the Punnett square (mother/father alleles). */
  mother: '#d6336c',
  father: '#2f6fed',
  dominant: '#16a34a',
  recessive: '#94a3b8',

  // ── DNA → Chromosome → Gene zoom structures ───────────────────────────
  cellMembrane: '#2f8fd6',
  cytoplasm: 'rgba(47,143,214,0.14)',
  nucleusFill: '#7c5cd6',
  nucleolus: '#5b3fae',
  chromatin: 'rgba(124,92,214,0.55)',
  chromosome: '#d6455a',
  centromere: '#fff7ec',
  dnaStrandA: '#1f9ec7',
  dnaStrandB: '#e8654f',
  basePair: '#f39c12',
  gene: '#e6b800',
  geneGlow: 'rgba(230,184,0,0.25)',
  histone: '#8a7658',
}
