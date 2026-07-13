import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

type Allele = 'A' | 'a'

function punnett(mother: [Allele, Allele], father: [Allele, Allele]) {
  return [
    [
      [mother[0], father[0]] as [Allele, Allele],
      [mother[0], father[1]] as [Allele, Allele],
    ],
    [
      [mother[1], father[0]] as [Allele, Allele],
      [mother[1], father[1]] as [Allele, Allele],
    ],
  ]
}

function phenotype(pair: [Allele, Allele]) {
  return pair.includes('A') ? 'Dominant' : 'Recessive'
}

export function PunnettSquareSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mother, setMother] = useState<[Allele, Allele]>(['A', 'a'])
  const [father, setFather] = useState<[Allele, Allele]>(['A', 'a'])
  const [version, setVersion] = useState(0)

  const grid = useMemo(() => punnett(mother, father), [mother, father])
  const dominantCount = grid.flat().filter((p) => p.includes('A')).length

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const fs = fontPx(14, w, h)
      clearThemedScene(ctx, w, h, 'biology')

      const size = Math.min(w, h) * 0.62
      const x0 = (w - size) / 2
      const y0 = (h - size) / 2 + 8
      const cell = size / 2

      ctx.fillStyle = '#1a252f'
      ctx.font = `600 ${fs}px Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`Mother ${mother.join('')}  ×  Father ${father.join('')}`, w / 2, 28)

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const x = x0 + c * cell
          const y = y0 + r * cell
          const pair = grid[r][c]
          const dom = pair.includes('A')
          ctx.fillStyle = dom ? '#d5f5e3' : '#fadbd8'
          ctx.fillRect(x, y, cell, cell)
          ctx.strokeStyle = '#2c3e50'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, cell, cell)
          ctx.fillStyle = '#1a252f'
          ctx.font = `600 ${fs + 8}px Roboto, sans-serif`
          ctx.fillText(pair.slice().sort().join(''), x + cell / 2, y + cell / 2 - 4)
          ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
          ctx.fillStyle = '#5d6d7e'
          ctx.fillText(phenotype(pair), x + cell / 2, y + cell / 2 + fs + 4)
        }
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.fillText(
        `Dominant phenotype chance: ${((dominantCount / 4) * 100).toFixed(0)}%`,
        w / 2,
        h - 18,
      )
    },
    [dominantCount, father, grid, mother],
  )

  useCanvasLoop(canvasRef, draw, false, version)

  const setPair = (who: 'm' | 'f', value: string) => {
    const pair = value.split('') as [Allele, Allele]
    if (who === 'm') setMother(pair)
    else setFather(pair)
    setVersion((v) => v + 1)
  }

  return (
    <SimShell
      title="Trait Inheritance"
      subtitle="Monohybrid Punnett square — dominant vs recessive"
      canvasRef={canvasRef}
      running={false}
      hidePlay
      onTogglePlay={() => undefined}
      onReset={() => {
        setMother(['A', 'a'])
        setFather(['A', 'a'])
        setVersion((v) => v + 1)
      }}
      controls={
        <>
          <ControlSection title="Parents">
            <ControlHint>A = dominant allele, a = recessive allele.</ControlHint>
            <ControlSelect
              label="Mother genotype"
              value={mother.join('')}
              options={[
                { value: 'AA', label: 'AA' },
                { value: 'Aa', label: 'Aa' },
                { value: 'aa', label: 'aa' },
              ]}
              onChange={(v) => setPair('m', v)}
            />
            <ControlSelect
              label="Father genotype"
              value={father.join('')}
              options={[
                { value: 'AA', label: 'AA' },
                { value: 'Aa', label: 'Aa' },
                { value: 'aa', label: 'aa' },
              ]}
              onChange={(v) => setPair('f', v)}
            />
          </ControlSection>
          <ControlSection title="Prediction">
            <ControlStats>
              <ControlStat label="Dominant outcomes" value={`${dominantCount} / 4`} />
            </ControlStats>
          </ControlSection>
        </>
      }
    />
  )
}
