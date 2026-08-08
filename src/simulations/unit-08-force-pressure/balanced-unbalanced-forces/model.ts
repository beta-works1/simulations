/** Balanced vs unbalanced forces — net force and motion (book p.94). */

export function netForce(fLeft: number, fRight: number): number {
  return fRight - fLeft
}

/** Balanced when opposing pushes nearly cancel (|net| < 0.5 N). */
export function isBalanced(fLeft: number, fRight: number): boolean {
  return Math.abs(netForce(fLeft, fRight)) < 0.5
}

/** Horizontal offset for the box (px-ish), 0 when balanced. */
export function boxOffset(fLeft: number, fRight: number, maxPx = 120): number {
  const net = netForce(fLeft, fRight)
  if (Math.abs(net) < 0.5) return 0
  const clamped = Math.max(-20, Math.min(20, net))
  return (clamped / 20) * maxPx
}

export function motionLabel(fLeft: number, fRight: number): string {
  if (isBalanced(fLeft, fRight)) return 'Balanced — box stays put'
  const net = netForce(fLeft, fRight)
  return net > 0 ? 'Unbalanced — moves right' : 'Unbalanced — moves left'
}
