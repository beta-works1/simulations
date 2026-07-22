import './splash.js'

import { brand, madeWithSceneryStackOnLight, madeWithSceneryStackOnDark } from 'scenerystack/brand'
import type { TBrand } from 'scenerystack/brand'

const Brand: TBrand = {
  id: 'made-with-scenerystack',
  name: 'SimLab',
  copyright: 'SimLab Interactive Simulations',
  getLinks: () => [],
  logoOnBlackBackground: madeWithSceneryStackOnDark,
  logoOnWhiteBackground: madeWithSceneryStackOnLight,
}

brand.register('Brand', Brand)
