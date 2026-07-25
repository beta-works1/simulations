import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Line, Node, Rectangle, Text } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PunnettSquareModel } from './model/PunnettSquareModel.js'
import { PunnettSquareScreenView } from './view/PunnettSquareScreenView.js'
import { HeredityConstants } from '../../shared/HeredityConstants.js'
import { HeredityColors } from '../../shared/HeredityColors.js'
import { PunnettSquareStrings } from './PunnettSquareStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PunnettSquareScreen extends Screen<PunnettSquareModel, PunnettSquareScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      HeredityConstants.SCREEN_OPTIONS,
      {
        name: PunnettSquareStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: HeredityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PunnettSquareModel(),
      (model) => new PunnettSquareScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const size = 100
  const iconNode = new Rectangle(0, 0, size, size, {
    fill: '#a04000',
    cornerRadius: 12,
  })
  const grid = new Node()
  const gridSize = 60
  const gx = (size - gridSize) / 2
  const gy = (size - gridSize) / 2 + 4
  grid.addChild(
    new Rectangle(gx, gy, gridSize, gridSize, {
      fill: '#fdebd3',
      stroke: '#2b1d0e',
      lineWidth: 2,
    }),
  )
  grid.addChild(new Line(gx + gridSize / 2, gy, gx + gridSize / 2, gy + gridSize, { stroke: '#2b1d0e', lineWidth: 2 }))
  grid.addChild(new Line(gx, gy + gridSize / 2, gx + gridSize, gy + gridSize / 2, { stroke: '#2b1d0e', lineWidth: 2 }))
  grid.addChild(new Text('A', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#f39c12', centerX: gx + gridSize * 0.25, centerY: gy + gridSize * 0.25 }))
  grid.addChild(new Text('a', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#27ae60', centerX: gx + gridSize * 0.75, centerY: gy + gridSize * 0.75 }))
  iconNode.addChild(grid)
  return new ScreenIcon(iconNode, {
    fill: HeredityColors.screenBackgroundColorProperty,
  })
}
