import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const ns = new Namespace('carbon-oxygen')

export const CarbonColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(ns, 'background', { default: '#0b1628' }),
  panelBorderProperty: new ProfileColorProperty(ns, 'panelBorder', { default: '#1e8449' }),
  buttonProperty: new ProfileColorProperty(ns, 'button', { default: '#27ae60' }),
}

export const CarbonConstants = {
  SCREEN_OPTIONS: {
    showUnselectedHomeScreenIconFrame: true,
    showScreenIconFrameForNavigationBarFill: 'black',
  },
  HISTORY_MAX: 180,
  CO2_MIN: 5,
  CO2_MAX: 95,
  DAY_NIGHT_PERIOD: 16,
}
