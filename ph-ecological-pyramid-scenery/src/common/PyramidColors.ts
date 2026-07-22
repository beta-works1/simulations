import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const ns = new Namespace('ecological-pyramid')

export const PyramidColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(ns, 'background', { default: '#0b1628' }),
  panelBorderProperty: new ProfileColorProperty(ns, 'panelBorder', { default: '#145a32' }),
  buttonProperty: new ProfileColorProperty(ns, 'button', { default: '#27ae60' }),
  playbackButtonProperty: new ProfileColorProperty(ns, 'playbackButton', { default: '#2980b9' }),
}

export const PyramidConstants = {
  SCREEN_OPTIONS: {
    showUnselectedHomeScreenIconFrame: true,
    showScreenIconFrameForNavigationBarFill: 'black',
  },
  BASE_MIN: 1000,
  BASE_MAX: 50000,
  BASE_DEFAULT: 10000,
  ENERGY_TRANSFER: 0.1,
}
