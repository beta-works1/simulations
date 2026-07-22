import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { EcologyConstants } from '../../shared/EcologyConstants.js'
import { EcologyColors } from '../../shared/EcologyColors.js'
import { PyramidStrings } from './PyramidStrings.js'
import { PYRAMID_COLORS } from './model/PyramidModel.js'
import { PyramidModel } from './model/PyramidModel.js'
import { PyramidScreenView } from './view/PyramidScreenView.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PyramidScreen extends Screen<PyramidModel, PyramidScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      EcologyConstants.SCREEN_OPTIONS,
      {
        name: PyramidStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: EcologyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PyramidModel(),
      model => new PyramidScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const root = new Node()
  root.addChild(
    new Rectangle(0, 0, 100, 100, {
      fill: '#0e2433',
      cornerRadius: 12,
    }),
  )
  const tiers = [
    { y: 72, hw: 38, color: PYRAMID_COLORS[0] },
    { y: 54, hw: 30, color: PYRAMID_COLORS[1] },
    { y: 36, hw: 22, color: PYRAMID_COLORS[2] },
    { y: 18, hw: 14, color: PYRAMID_COLORS[3] },
  ]
  for (const t of tiers) {
    const shape = new Shape()
      .moveTo(50 - t.hw, t.y + 14)
      .lineTo(50 + t.hw, t.y + 14)
      .lineTo(50 + t.hw * 0.7, t.y)
      .lineTo(50 - t.hw * 0.7, t.y)
      .close()
    root.addChild(new Path(shape, { fill: t.color }))
  }
  return new ScreenIcon(root, {
    fill: EcologyColors.screenBackgroundColorProperty,
  })
}
