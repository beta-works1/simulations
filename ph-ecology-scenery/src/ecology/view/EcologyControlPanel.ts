import { Bounds2 } from 'scenerystack/dot'
import { Shape } from 'scenerystack/kite'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { Node, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { EcologyColors } from '../../common/EcologyColors.js'
import { EcologyStrings } from '../../EcologyStrings.js'
import {
  FoodWebModel,
  grasslandChain,
  grasslandWeb,
  SPECIES_PALETTE,
} from '../model/FoodWebModel.js'
import { EcologySounds } from './EcologySounds.js'
import { SpeciesPaletteChip, type DropTarget } from './SpeciesPaletteChip.js'

type Options = EmptySelfOptions & PanelOptions

export type EcologyControlPanelExtras = {
  dropTarget: DropTarget
  ghostLayer: Node
  panelMaxHeight: number
  sounds: EcologySounds
}

export class EcologyControlPanel extends Panel {
  public constructor(
    model: FoodWebModel,
    providedOptions: Options,
    extras: EcologyControlPanelExtras,
  ) {
    const contentWidth = (providedOptions.maxWidth as number | undefined) ?? 220
    const { dropTarget, ghostLayer, panelMaxHeight, sounds } = extras

    const options = optionize<Options, EmptySelfOptions, PanelOptions>()(
      {
        xMargin: 10,
        yMargin: 10,
        stroke: EcologyColors.controlPanelBorderColorProperty,
        lineWidth: 2,
        fill: 'rgba(15, 35, 54, 0.94)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, listener: () => void) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(11), fill: 'white', maxWidth: contentWidth - 24 }),
        baseColor: EcologyColors.controlPanelButtonColorProperty,
        xMargin: 8,
        yMargin: 5,
        listener,
        minWidth: contentWidth - 8,
      })

    const section = (label: string) =>
      new Text(label, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#a8d4a0',
        maxWidth: contentWidth,
      })

    const stabilityText = new Text(model.stabilityMessageProperty, {
      font: new PhetFont(10),
      fill: '#ecf0f1',
      maxWidth: contentWidth,
    })

    const scoreText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#f4d03f',
      maxWidth: contentWidth,
    })
    model.stabilityScoreProperty.link((score) => {
      scoreText.string = `Stability: ${score}%`
    })

    const takeawayText = new Text(model.takeawayProperty, {
      font: new PhetFont(10),
      fill: '#fca5a5',
      maxWidth: contentWidth,
    })

    const linkLabel = new Text('Link mode: Off', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: contentWidth - 24,
    })
    const linkBtn = new RectangularPushButton({
      content: linkLabel,
      baseColor: EcologyColors.controlPanelButtonColorProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        const next = !model.linkModeProperty.value
        model.toggleLinkMode(next)
        sounds.linkToggle(next)
      },
      minWidth: contentWidth - 8,
    })
    model.linkModeProperty.link((on) => {
      linkLabel.string = on ? 'Link mode: On' : 'Link mode: Off'
    })

    let soundOn = true
    const soundLabel = new Text('Sound: On', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: contentWidth - 24,
    })
    const soundBtn = new RectangularPushButton({
      content: soundLabel,
      baseColor: EcologyColors.controlPanelButtonColorProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        soundOn = !soundOn
        sounds.setEnabled(soundOn)
        soundLabel.string = soundOn ? 'Sound: On' : 'Sound: Off'
        if (soundOn) sounds.button()
      },
      minWidth: contentWidth - 8,
    })

    const paletteChips = SPECIES_PALETTE.map(
      (item) =>
        new SpeciesPaletteChip(
          item.level,
          item.label,
          contentWidth - 8,
          dropTarget,
          (level, nx, ny) => {
            model.addSpeciesAt(level, nx, ny)
            sounds.dropOk()
          },
          ghostLayer,
          sounds,
        ),
    )

    const inner = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        new Text(EcologyStrings.controlsStringProperty, {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: 'white',
          maxWidth: contentWidth,
        }),
        scoreText,
        stabilityText,
        takeawayText,
        section('Build'),
        soundBtn,
        linkBtn,
        mkBtn('Remove selected', () => {
          if (model.selectedIdProperty.value) {
            model.removeSelected()
            sounds.remove()
          } else {
            sounds.softClick()
          }
        }),
        section('Drag onto scene'),
        new Text('Drag a chip and drop it on the ecosystem', {
          font: new PhetFont(9),
          fill: '#95a5a6',
          maxWidth: contentWidth,
        }),
        ...paletteChips,
        section('Examples'),
        mkBtn('Food chain', () => {
          model.load(grasslandChain())
          sounds.loadExample()
        }),
        mkBtn('Grassland web', () => {
          model.load(grasslandWeb())
          sounds.loadExample()
        }),
        mkBtn('Reset', () => {
          model.reset()
          sounds.resetAll()
        }),
      ],
    })

    const viewportH = Math.max(220, panelMaxHeight - 24)
    let scrollY = 0
    const clip = new Node({
      clipArea: Shape.bounds(new Bounds2(0, 0, contentWidth, viewportH)),
      children: [inner],
      pickable: true,
    })
    clip.localBounds = new Bounds2(0, 0, contentWidth, viewportH)

    const applyScroll = () => {
      const maxScroll = Math.max(0, inner.bounds.height - viewportH)
      scrollY = Math.max(-maxScroll, Math.min(0, scrollY))
      inner.y = scrollY
    }
    inner.boundsProperty.link(applyScroll)
    clip.addInputListener({
      wheel: (event) => {
        const dy = event.domEvent?.deltaY ?? 0
        if (dy === 0) return
        scrollY -= dy * 0.55
        applyScroll()
        event.handle()
      },
    })

    super(clip, options)
  }
}
