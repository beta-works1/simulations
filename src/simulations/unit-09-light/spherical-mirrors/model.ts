/** Spherical mirror image cases — book p.119. */

export type MirrorKind = 'concave' | 'convex'
export type ImageNature = 'real' | 'virtual'
export type ImageOrientation = 'upright' | 'inverted'
export type ImageSize = 'diminished' | 'enlarged' | 'same' | 'at infinity'

export interface SphericalImage {
  kind: MirrorKind
  objectDistance: number
  focalLength: number
  centreDistance: number
  nature: ImageNature
  orientation: ImageOrientation
  size: ImageSize
  /** Short Class-8 caption. */
  label: string
}

/** Fixed f = 20 cm so C = 40 cm (school ray diagrams). */
export const DEFAULT_FOCAL = 20

/**
 * Concave: beyond C → real inverted diminished;
 * between F and C → real inverted enlarged;
 * at C → real inverted same;
 * at F → at infinity;
 * inside F → virtual upright enlarged.
 * Convex: always virtual upright diminished.
 */
export function sphericalImage(
  kind: MirrorKind,
  objectDistance: number,
  f = DEFAULT_FOCAL,
): SphericalImage {
  const u = Math.max(1, objectDistance)
  const C = 2 * f

  if (kind === 'convex') {
    return {
      kind,
      objectDistance: u,
      focalLength: f,
      centreDistance: C,
      nature: 'virtual',
      orientation: 'upright',
      size: 'diminished',
      label: 'Virtual, upright, diminished',
    }
  }

  // Concave
  if (Math.abs(u - f) < 0.5) {
    return {
      kind,
      objectDistance: u,
      focalLength: f,
      centreDistance: C,
      nature: 'real',
      orientation: 'inverted',
      size: 'at infinity',
      label: 'Image at infinity (rays parallel)',
    }
  }
  if (u < f) {
    return {
      kind,
      objectDistance: u,
      focalLength: f,
      centreDistance: C,
      nature: 'virtual',
      orientation: 'upright',
      size: 'enlarged',
      label: 'Virtual, upright, enlarged (inside F)',
    }
  }
  if (Math.abs(u - C) < 0.5) {
    return {
      kind,
      objectDistance: u,
      focalLength: f,
      centreDistance: C,
      nature: 'real',
      orientation: 'inverted',
      size: 'same',
      label: 'Real, inverted, same size (at C)',
    }
  }
  if (u > C) {
    return {
      kind,
      objectDistance: u,
      focalLength: f,
      centreDistance: C,
      nature: 'real',
      orientation: 'inverted',
      size: 'diminished',
      label: 'Real, inverted, diminished (beyond C)',
    }
  }
  // Between F and C
  return {
    kind,
    objectDistance: u,
    focalLength: f,
    centreDistance: C,
    nature: 'real',
    orientation: 'inverted',
    size: 'enlarged',
    label: 'Real, inverted, enlarged (between F and C)',
  }
}
