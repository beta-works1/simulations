/**
 * Shared canvas presentation — re-export theme helpers + optics stroke polish.
 * Import from here (or canvasTheme) in view/draw code only — not model step logic.
 */
export {
  SCENE,
  STROKE,
  drawFaintGrid,
  drawGlow,
  drawStarfield,
  fillThemeBackground,
  hexToRgba,
  strokeWithGlow,
  withShadow,
  type SceneTheme,
} from '../../sims/shared/canvasTheme'
