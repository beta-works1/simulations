import type { Bounds2 } from 'scenerystack/dot'

/** Shared layout grid for the pH lab screen. */
export interface PhLabLayoutRegions {
  status: { left: number; top: number; width: number; height: number }
  guide: { left: number; top: number; width: number }
  controls: { right: number; top: number; width: number }
  center: { left: number; right: number; width: number; centerX: number }
  reagentY: number
  mainBeaker: { centerX: number; centerY: number; width: number; height: number }
  scaleY: number
  bench: { left: number; top: number; width: number; height: number }
  meter: { left: number; top: number; width: number; height: number }
  litmus: { left: number; top: number; width: number; height: number }
  contentTop: number
}

const MARGIN = 16
const GUTTER = 14
const STATUS_HEIGHT = 40
const LEFT_COL_WIDTH = 248
const RIGHT_COL_WIDTH = 228

const REAGENT_BEAKER_H = 108
const MAIN_BEAKER_W = 124
const MAIN_BEAKER_H = 162
const METER_W = 118
const METER_H = 86
const LITMUS_W = 20
const LITMUS_H = 84

export function computePhLabLayout(bounds: Bounds2): PhLabLayoutRegions {
  const h = bounds.height
  const statusTop = 10
  const contentTop = statusTop + STATUS_HEIGHT + GUTTER

  const leftColLeft = MARGIN
  const rightColRight = bounds.maxX - MARGIN
  const rightColLeft = rightColRight - RIGHT_COL_WIDTH
  const centerLeft = leftColLeft + LEFT_COL_WIDTH + GUTTER
  const centerRight = rightColLeft - GUTTER
  const centerWidth = centerRight - centerLeft
  const centerX = centerLeft + centerWidth / 2

  const reagentY = contentTop + 64
  const reagentLabelBottom = reagentY + REAGENT_BEAKER_H / 2 + 26
  const mainBeakerTop = reagentLabelBottom + 10
  const mainBeakerY = mainBeakerTop + MAIN_BEAKER_H / 2
  const mainBeakerLeft = centerX - MAIN_BEAKER_W / 2 - 6
  const mainBeakerRight = mainBeakerLeft + MAIN_BEAKER_W
  const mainBeakerCenterX = mainBeakerLeft + MAIN_BEAKER_W / 2

  const scaleY = mainBeakerY + MAIN_BEAKER_H / 2 + 22
  const benchTop = Math.min(h - 56, scaleY + 52)

  const meterLeft = Math.max(centerLeft + 4, mainBeakerLeft - METER_W - 12)
  const litmusLeft = Math.max(mainBeakerRight + 28, centerLeft + MAIN_BEAKER_W + 12)

  return {
    status: {
      left: MARGIN,
      top: statusTop,
      width: bounds.width - MARGIN * 2,
      height: STATUS_HEIGHT,
    },
    guide: {
      left: leftColLeft,
      top: contentTop,
      width: LEFT_COL_WIDTH,
    },
    controls: {
      right: rightColRight,
      top: contentTop,
      width: RIGHT_COL_WIDTH,
    },
    center: {
      left: centerLeft,
      right: centerRight,
      width: centerWidth,
      centerX,
    },
    reagentY,
    mainBeaker: {
      centerX: mainBeakerCenterX,
      centerY: mainBeakerY,
      width: MAIN_BEAKER_W,
      height: MAIN_BEAKER_H,
    },
    scaleY,
    bench: {
      left: centerLeft,
      top: benchTop,
      width: centerWidth,
      height: 44,
    },
    meter: {
      left: meterLeft,
      top: mainBeakerY - 32,
      width: METER_W,
      height: METER_H,
    },
    litmus: {
      left: litmusLeft,
      top: mainBeakerY - 38,
      width: LITMUS_W,
      height: LITMUS_H,
    },
    contentTop,
  }
}

/** Evenly space N items across a horizontal span. */
export function spacedCenters(left: number, width: number, count: number, inset = 0.1): number[] {
  const pad = width * inset
  const span = width - pad * 2
  if (count <= 1) return [left + width / 2]
  return Array.from({ length: count }, (_, i) => left + pad + (span * i) / (count - 1))
}
