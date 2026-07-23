export const NervousConstants = {
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
