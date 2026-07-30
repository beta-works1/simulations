import { Shape } from 'scenerystack/kite'

/**
 * Reusable teaching-shell layout metric for Grade 8 SceneryStack sims
 * (Ch 12 Our Universe first, then other SoftButton shells).
 *
 * Acceptance checks for every new/ported experiment:
 * 1. No decorative gloss / hairline across the top of a dark stage.
 * 2. Title + caption own a reserved header band; era/status pills never overlap them.
 * 3. Screen background matches the stage so letterbox gutters read as full-bleed, not side borders.
 * 4. Stage scene is clip-masked to the rounded frame; orbits/particles stay inside.
 * 5. Orbit / diagram radius ≤ MAX_ORBIT_FRAC × min(stageW, stageH).
 * 6. Catalog + detail expose Download HTML whenever offlineHtml is wired; rebuild offline after package changes.
 */
export const TeachingShellLayout = {
  SCREEN_VIEW_X_MARGIN: 8,
  SCREEN_VIEW_Y_MARGIN: 8,
  LEFT_PANEL_W: 190,
  RIGHT_PANEL_W: 290,
  PANEL_GAP: 12,
  /** Space from guidance banner bottom to stage / side panels. */
  GUIDE_TO_STAGE_GAP: 10,
  /** Approx banner height used when laying out before measure. */
  GUIDE_RESERVE_H: 72,
  /** Title + caption band inside the stage — labels must stay outside this zone. */
  STAGE_TITLE_BAND: 58,
  /** Padding inside the stage for scene content. */
  STAGE_SCENE_PAD: 18,
  STAGE_CORNER_RADIUS: 18,
  /** Max elliptical orbit / diagram radius as a fraction of the shorter stage side. */
  MAX_ORBIT_FRAC: 0.36,
  /** Dark lab backdrop — letterbox gutters blend into the sim instead of light side borders. */
  SCREEN_BACKGROUND: '#0b1628',
} as const

export type TeachingShellStageGeom = {
  left: number
  top: number
  width: number
  height: number
  centerX: number
  centerY: number
  /** Usable scene box below the title band. */
  sceneLeft: number
  sceneTop: number
  sceneWidth: number
  sceneHeight: number
  sceneCenterX: number
  sceneCenterY: number
  maxOrbitR: number
}

export function computeTeachingShellStage(
  layoutWidth: number,
  layoutHeight: number,
  options?: { leftW?: number; rightW?: number; guideReserveH?: number },
): TeachingShellStageGeom {
  const m = TeachingShellLayout.SCREEN_VIEW_X_MARGIN
  const my = TeachingShellLayout.SCREEN_VIEW_Y_MARGIN
  const leftW = options?.leftW ?? TeachingShellLayout.LEFT_PANEL_W
  const rightW = options?.rightW ?? TeachingShellLayout.RIGHT_PANEL_W
  const gap = TeachingShellLayout.PANEL_GAP
  const guideH = options?.guideReserveH ?? TeachingShellLayout.GUIDE_RESERVE_H
  const pad = TeachingShellLayout.STAGE_SCENE_PAD
  const titleBand = TeachingShellLayout.STAGE_TITLE_BAND

  const left = m + leftW + gap
  const top = my + guideH
  const width = layoutWidth - m * 2 - leftW - gap - rightW - gap
  const height = layoutHeight - my * 2 - guideH
  const sceneLeft = left + pad
  const sceneTop = top + titleBand
  const sceneWidth = Math.max(40, width - pad * 2)
  const sceneHeight = Math.max(40, height - titleBand - pad)
  const maxOrbitR = Math.min(sceneWidth, sceneHeight) * TeachingShellLayout.MAX_ORBIT_FRAC

  return {
    left,
    top,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    sceneLeft,
    sceneTop,
    sceneWidth,
    sceneHeight,
    sceneCenterX: sceneLeft + sceneWidth / 2,
    sceneCenterY: sceneTop + sceneHeight / 2,
    maxOrbitR,
  }
}

/** Clip mask matching StageBackdrop's rounded frame. */
export function stageClipShape(left: number, top: number, width: number, height: number): Shape {
  const r = TeachingShellLayout.STAGE_CORNER_RADIUS
  return Shape.roundRect(left, top, width, height, r, r)
}
