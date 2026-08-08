/** Pencil-in-water refraction at a boundary — Unit 9, p.107. */

/** Incident angle from the normal, degrees (0–70). */
export function clampAngle(deg: number): number {
  return Math.max(0, Math.min(70, deg))
}

/**
 * Apparent sideways bend offset (px proxy) for a pencil crossing air→water.
 * Larger angles → larger apparent offset (classroom demo, not Snell’s law solve).
 */
export function pencilBendOffset(angleDeg: number): number {
  const a = clampAngle(angleDeg)
  // ~0–48 px lateral “bent” look under water
  return Math.round((a / 70) * 48)
}

/** Rough refracted angle proxy (water n≈1.33). */
export function apparentRefractedAngle(angleDeg: number): number {
  const a = (clampAngle(angleDeg) * Math.PI) / 180
  const nAir = 1
  const nWater = 1.33
  const sinR = (nAir / nWater) * Math.sin(a)
  if (sinR >= 1) return 90
  return Math.round((Math.asin(sinR) * 180) / Math.PI)
}
