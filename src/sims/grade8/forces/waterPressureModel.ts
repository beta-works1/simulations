/** Water pressure vs depth — PTB Ch 3. Model only; Canvas draws state. */

export interface WaterPressureState {
  jets: { hole: number; x: number; y: number; vx: number; vy: number; life: number }[]
  time: number
}

export function createWaterPressureState(): WaterPressureState {
  return { jets: [], time: 0 }
}

/** Gauge pressure P = ρ g h (unchanged). */
export function waterPressure(rho: number, depthM: number): number {
  return rho * 9.8 * depthM
}

export function stepWaterPressure(
  s: WaterPressureState,
  dt: number,
  running: boolean,
  fillHeight: number,
  probeDepth: number,
  rho: number,
  w: number,
  h: number,
): WaterPressureState {
  let { jets, time } = s
  time += dt

  const tankL = w * 0.28
  const tankR = w * 0.72
  const tankT = h * 0.12
  const tankB = h * 0.82
  const waterTop = tankB - fillHeight * (tankB - tankT - 10)

  const holes = [0.25, 0.5, 0.75]
  if (running) {
    for (const frac of holes) {
      const hy = tankT + frac * (tankB - tankT)
      if (hy >= waterTop) {
        const depthM = ((tankB - hy) / (tankB - tankT)) * fillHeight * 2.5
        const p = waterPressure(rho, depthM)
        const speed = Math.sqrt(Math.max(0, p)) * 1.8
        if (Math.random() < dt * 14) {
          jets.push({
            hole: frac,
            x: tankR + 4,
            y: hy,
            vx: speed * (0.85 + Math.random() * 0.3),
            vy: (Math.random() - 0.5) * 2,
            life: 1,
          })
        }
      }
    }
    const probeY = tankT + probeDepth * (tankB - tankT)
    if (probeY >= waterTop && Math.random() < dt * 10) {
      const depthM = ((tankB - probeY) / (tankB - tankT)) * fillHeight * 2.5
      const p = waterPressure(rho, depthM)
      jets.push({
        hole: -1,
        x: tankL - 4,
        y: probeY,
        vx: -Math.sqrt(Math.max(0, p)) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
      })
    }
  }

  jets = jets
    .map((j) => ({
      ...j,
      x: j.x + j.vx * dt * 18,
      y: j.y + j.vy * dt * 18,
      vy: j.vy + 28 * dt,
      life: j.life - dt * 0.9,
    }))
    .filter((j) => j.life > 0 && j.x > tankL - 80 && j.x < tankR + 120)

  return { jets, time }
}

export const FLUIDS = [
  { id: 'water', label: 'Water (1.0 g/cm³)', rho: 1.0 },
  { id: 'salt', label: 'Salt water (1.03 g/cm³)', rho: 1.03 },
  { id: 'mercury', label: 'Mercury-like (13.6 g/cm³)', rho: 13.6 },
]
