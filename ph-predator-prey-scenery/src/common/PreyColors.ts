import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const ns = new Namespace('predator-prey')

export const PreyColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(ns, 'background', { default: '#0b1f2a' }),
  panelBorderProperty: new ProfileColorProperty(ns, 'panelBorder', { default: '#0e6655' }),
  buttonProperty: new ProfileColorProperty(ns, 'button', { default: '#16a085' }),
  playbackButtonProperty: new ProfileColorProperty(ns, 'playback', { default: '#2980b9' }),
  preyProperty: new ProfileColorProperty(ns, 'prey', { default: '#27ae60' }),
  predatorProperty: new ProfileColorProperty(ns, 'predator', { default: '#e74c3c' }),
  accentProperty: new ProfileColorProperty(ns, 'accent', { default: '#f1c40f' }),
  dangerProperty: new ProfileColorProperty(ns, 'danger', { default: '#c0392b' }),
}

export const PreyConstants = {
  SCREEN_OPTIONS: {
    showUnselectedHomeScreenIconFrame: true,
    showScreenIconFrameForNavigationBarFill: 'black',
  },
  PREY_MIN: 0.5,
  PREY_MAX: 120,
  PRED_MIN: 0.5,
  PRED_MAX: 80,
  GROWTH_MIN: 0.4,
  GROWTH_MAX: 1.8,
  /** Calmer default for Grade 8 — easier to watch the cycle. */
  SPEED_DEFAULT: 0.45,
  SPEED_MIN: 0.2,
  SPEED_MAX: 1.5,
  HISTORY_MAX: 160,
  MAX_PREY_AGENTS: 32,
  MAX_PRED_AGENTS: 16,
}
