import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('ph-laboratory')

export const PhLabColors = {
  controlPanelBorderColorProperty: new ProfileColorProperty(namespace, 'controlPanelBorder', {
    default: '#0f766e',
  }),
  controlPanelButtonColorProperty: new ProfileColorProperty(namespace, 'controlPanelButton', {
    default: '#5eead4',
  }),
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    default: '#eef6f8',
  }),
  beakerFillColorProperty: new ProfileColorProperty(namespace, 'beakerFill', {
    default: 'rgb(80,180,80)',
  }),
}
