import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { SoftButton } from './SoftButton.js'
import { LightColors } from '../LightColors.js'

export type MiniQuizOption = { label: string; correct: boolean }

/**
 * Compact in-sim checkpoint quiz (ecology density without a new sim).
 */
export class MiniQuiz extends Node {
  private readonly prompt: Text
  private readonly feedback: Text
  private readonly buttons: SoftButton[] = []
  private readonly bg: Rectangle
  private onAnswer: ((correct: boolean) => void) | null = null

  public constructor(width: number) {
    super({ visible: false })
    this.bg = new Rectangle(0, 0, width, 150, {
      cornerRadius: 12,
      fill: 'rgba(255,255,255,0.97)',
      stroke: LightColors.accent,
      lineWidth: 2,
    })
    this.addChild(this.bg)
    this.addChild(
      new Text('Quick check', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: LightColors.accent,
        left: 12,
        top: 8,
      }),
    )
    this.prompt = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: LightColors.ink,
      left: 12,
      top: 28,
      maxWidth: width - 24,
    })
    this.addChild(this.prompt)
    this.feedback = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: LightColors.muted,
      left: 12,
      bottom: 14,
      maxWidth: width - 24,
    })
    this.addChild(this.feedback)
  }

  public showQuiz(
    question: string,
    options: MiniQuizOption[],
    onAnswer?: (correct: boolean) => void,
  ): void {
    this.onAnswer = onAnswer ?? null
    this.prompt.string = question
    this.feedback.string = ''
    for (const b of this.buttons) {
      this.removeChild(b)
    }
    this.buttons.length = 0
    options.forEach((opt, i) => {
      const btn = new SoftButton(opt.label, () => this.handle(opt.correct), {
        width: this.bg.rectWidth - 24,
        height: 32,
        fill: opt.correct ? '#16a34a' : '#64748b',
        fontSize: 12,
      })
      btn.left = 12
      btn.top = 58 + i * 38
      this.buttons.push(btn)
      this.addChild(btn)
    })
    this.bg.setRectHeight(Math.max(150, 58 + options.length * 38 + 28))
    this.feedback.bottom = this.bg.rectHeight - 10
    this.visible = true
  }

  public hideQuiz(): void {
    this.visible = false
  }

  private handle(correct: boolean): void {
    this.feedback.string = correct ? 'Correct!' : 'Not quite — try again or re-run the sim.'
    this.feedback.fill = correct ? '#16a34a' : '#dc2626'
    this.onAnswer?.(correct)
    if (correct) {
      setTimeout(() => {
        this.hideQuiz()
      }, 900)
    }
  }
}
