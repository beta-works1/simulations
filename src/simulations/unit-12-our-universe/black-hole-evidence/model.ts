/** Black hole evidence: orbital wobble + gravitational waves — Unit 12, p.153. */

export interface EvidenceState {
  playWobble: boolean
  showGwRipple: boolean
  caption: string
}

export function evidenceState(playWobble: boolean, showGwRipple: boolean): EvidenceState {
  const parts: string[] = []
  if (playWobble) {
    parts.push('Stars near a black hole wobble / orbit a dark massive centre.')
  }
  if (showGwRipple) {
    parts.push('Merging black holes send spacetime ripples (gravitational waves).')
  }
  if (parts.length === 0) {
    parts.push('Turn on wobble or GW ripple to see evidence clues.')
  }
  return { playWobble, showGwRipple, caption: parts.join(' ') }
}
