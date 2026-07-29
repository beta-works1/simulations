export type BlackHolePhase = 'collapse' | 'bending'

export const COLLAPSE_DURATION = 4
export const BEND_CYCLE = 6

export function collapseRadius(progress: number): number {
  const p = Math.min(1, Math.max(0, progress))
  return Math.max(0.02, 1 - p * p)
}

export function eventHorizonRadius(): number {
  return 28
}

export interface PhotonPath {
  startX: number; startY: number
  cp1X: number; cp1Y: number
  cp2X: number; cp2Y: number
  endX: number; endY: number
  captured: boolean
}

export function photonPaths(cx: number, cy: number, time: number): PhotonPath[] {
  const paths: PhotonPath[] = []
  const count = 7
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const offset = Math.floor(i / 2) * 22 + 30
    const startX = cx + side * 180
    const startY = cy - 80 + offset
    const miss = offset / 120
    const bend = (1 - miss) * 55 + Math.sin(time * 2 + i) * 4
    const endX = cx + side * 180
    const endY = cy + 60 + offset
    const captured = miss < 0.35
    paths.push({
      startX, startY,
      cp1X: cx + side * bend, cp1Y: cy - 40 + offset * 0.3,
      cp2X: cx + side * bend * 0.6, cp2Y: cy + 10,
      endX: captured ? cx : endX, endY: captured ? cy : endY, captured,
    })
  }
  return paths
}

export function phaseLabel(phase: BlackHolePhase): string {
  return phase === 'collapse' ? 'Stellar collapse' : 'Light bending near event horizon'
}

export function timelineProgress(phase: BlackHolePhase, collapseProgress: number, bendTime: number): number {
  if (phase === 'collapse') return Math.min(1, Math.max(0, collapseProgress)) * 0.5
  return 0.5 + (Math.min(BEND_CYCLE, Math.max(0, bendTime)) / BEND_CYCLE) * 0.5
}
