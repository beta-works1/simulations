export const EcologyConstants = {
  SCREEN_VIEW_X_MARGIN: 16,
  SCREEN_VIEW_Y_MARGIN: 12,
  SCREEN_OPTIONS: {
    showUnselectedHomeScreenIconFrame: true,
    showScreenIconFrameForNavigationBarFill: 'black',
  },
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

/** Frame-rate independent ease toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}
