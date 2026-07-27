import { Property } from 'scenerystack/axon'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions } from 'scenerystack/sun'
import { HBox, Node, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { LEVEL_COLORS, EcologyColors } from '../../common/EcologyColors.js'
import { EcologyStrings } from '../../EcologyStrings.js'
import { controlHint, controlSection } from '../../common/ui/controlPanelBits.js'
import { DepthSlider } from '../../common/ui/DepthSlider.js'
import { ScrollableNode } from '../../common/ui/ScrollableNode.js'
import { SoftButton } from '../../common/ui/SoftButton.js'
import { FoodWebModel, SPECIES_PALETTE, type TrophicLevel } from '../model/FoodWebModel.js'
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
    const w = (providedOptions.maxWidth as number | undefined) ?? 220
    const panelMaxHeight = extras.panelMaxHeight
    const { dropTarget, ghostLayer, sounds } = extras

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

    const btnW = w - 16

    const mkAction = (label: string, listener: () => void, fill?: string) =>
      new SoftButton(label, listener, {
        width: btnW,
        height: 30,
        fontSize: 11,
        fill,
        selected: true,
      })

    /** Toggle SoftButton bound to a boolean Property; sound + optional extra effect run on press. */
    const mkToggle = (
      labelOn: string,
      labelOff: string,
      property: Property<boolean>,
      onSound: (on: boolean) => void,
      afterToggle?: (on: boolean) => void,
    ) => {
      const btn = new SoftButton(
        property.value ? labelOn : labelOff,
        () => {
          const next = !property.value
          property.value = next
          onSound(next)
          afterToggle?.(next)
        },
        { width: btnW, height: 30, fontSize: 11, selected: property.value },
      )
      property.link((on) => {
        btn.setLabel(on ? labelOn : labelOff)
        btn.setSelected(on)
      })
      return btn
    }

    // --- Live status readouts -------------------------------------------------
    const scoreText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#f4d03f',
      maxWidth: w,
    })
    model.stabilityScoreProperty.link((score) => {
      scoreText.string = `Stability: ${score}%`
    })

    const starsText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: w,
    })
    model.starsProperty.link((n) => {
      starsText.string = n > 0 ? `⭐ x ${n}` : ''
      starsText.visible = n > 0
    })

    const stabilityText = new Text(model.stabilityMessageProperty, {
      font: new PhetFont(10),
      fill: '#ecf0f1',
      maxWidth: w,
    })
    const takeawayText = new Text(model.takeawayProperty, {
      font: new PhetFont(10),
      fill: '#fca5a5',
      maxWidth: w,
    })

    // --- Build section ---------------------------------------------------------
    const soundBtn = mkToggle(
      'Sound: On',
      'Sound: Off',
      model.soundEnabledProperty,
      (on) => {
        sounds.setEnabled(on)
        if (on) sounds.button()
      },
      () => model.toggleSound(),
    )

    const linkBtn = mkToggle(
      'Link mode: On',
      'Link mode: Off',
      model.linkModeProperty,
      (on) => sounds.linkToggle(on),
      (on) => model.toggleLinkMode(on),
    )

    const removeBtn = mkAction('Remove selected', () => {
      if (model.selectedIdProperty.value) {
        model.removeSelected()
        sounds.remove()
      }
      else {
        sounds.softClick()
      }
    }, '#64748b')

    const clearBtn = mkAction('Clear web', () => {
      model.clearWeb()
      sounds.remove()
    }, '#dc2626')

    // --- Display section ---------------------------------------------------------
    const labelsBtn = mkToggle(
      'Labels: On',
      'Labels: Off',
      model.showLabelsProperty,
      (on) => sounds.toggle(on),
    )
    const populationsBtn = mkToggle(
      'Populations: On',
      'Populations: Off',
      model.showPopulationsProperty,
      (on) => sounds.toggle(on),
    )

    // --- Energy section ---------------------------------------------------------
    const transferSlider = new DepthSlider(model.energyTransferPercentProperty, {
      min: 5,
      max: 20,
      width: btnW,
      label: 'Energy kept per step',
      format: (n) => `${Math.round(n)}%`,
      onTick: () => sounds.sliderTick(),
    })
    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: btnW,
      label: 'Sim speed',
      format: (n) => `${n.toFixed(2)}x`,
      onTick: () => sounds.sliderTick(),
    })

    // --- Add species (quick tap) ---------------------------------------------
    const halfW = (btnW - 6) / 2
    const quickAdd = (level: TrophicLevel, label: string) =>
      new SoftButton(
        label,
        () => {
          model.addSpecies(level)
          sounds.dropOk()
        },
        { width: halfW, height: 30, fontSize: 10, fill: LEVEL_COLORS[level], selected: true },
      )
    const addGrid = new VBox({
      align: 'left',
      spacing: 6,
      children: [
        new HBox({ spacing: 6, children: [quickAdd('producer', 'Producer'), quickAdd('herbivore', 'Primary')] }),
        new HBox({ spacing: 6, children: [quickAdd('carnivore', 'Consumer'), quickAdd('decomposer', 'Decomposer')] }),
      ],
    })

    const paletteChips = SPECIES_PALETTE.map(
      (item) =>
        new SpeciesPaletteChip(
          item.level,
          item.label,
          btnW,
          dropTarget,
          (level, nx, ny) => {
            model.addSpeciesAt(level, nx, ny)
            sounds.dropOk()
          },
          ghostLayer,
          sounds,
        ),
    )

    // --- Scenarios ---------------------------------------------------------------
    const foodChainBtn = mkAction('Food chain', () => {
      model.loadFoodChain()
      sounds.loadExample()
    })
    const grasslandBtn = mkAction('Grassland web', () => {
      model.loadGrassland()
      sounds.loadExample()
    })

    // --- Auto-layout ---------------------------------------------------------------
    const autoLayoutBtn = mkToggle(
      'Auto-layout: On',
      'Auto-layout: Off',
      model.autoLayoutProperty,
      (on) => sounds.toggle(on),
      () => model.randomizeLayout(),
    )

    const resetBtn = mkAction('Reset', () => {
      model.reset()
      sounds.resetAll()
    }, '#dc2626')

    const content = new VBox({
      align: 'left',
      spacing: 6,
      children: [
        new HBox({
          spacing: 8,
          children: [
            new Text(EcologyStrings.controlsStringProperty, {
              font: new PhetFont({ size: 15, weight: 'bold' }),
              fill: 'white',
              maxWidth: w - 60,
            }),
            starsText,
          ],
        }),
        scoreText,
        stabilityText,
        takeawayText,

        controlSection('Build', w),
        soundBtn,
        linkBtn,
        removeBtn,
        clearBtn,

        controlSection('Display', w),
        labelsBtn,
        populationsBtn,

        controlSection('Energy', w),
        transferSlider,
        speedSlider,

        controlSection('Add species', w),
        addGrid,
        controlHint('Or drag a chip and drop it on the ecosystem', w),
        ...paletteChips,

        controlSection('Scenarios', w),
        foodChainBtn,
        grasslandBtn,

        controlSection('Layout', w),
        autoLayoutBtn,

        resetBtn,
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
