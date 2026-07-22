import { Namespace } from 'scenerystack/phet-core'
import { ProfileColorProperty } from 'scenerystack/scenery'

const namespace = new Namespace('food-web')

export const EcologyColors = {
  screenBackgroundColorProperty: new ProfileColorProperty(namespace, 'background', {
    default: '#0f2536',
  }),
  controlPanelBorderColorProperty: new ProfileColorProperty(namespace, 'controlPanelBorder', {
    default: '#196f3d',
  }),
  controlPanelButtonColorProperty: new ProfileColorProperty(namespace, 'controlPanelButton', {
    default: '#27ae60',
  }),
}

export const LEVEL_COLORS = {
  producer: '#27ae60',
  herbivore: '#f1c40f',
  carnivore: '#e74c3c',
  decomposer: '#8e44ad',
} as const
