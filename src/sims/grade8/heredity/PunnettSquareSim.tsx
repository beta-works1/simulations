import { useCallback, useMemo, useRef, useState } from 'react'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'

type Allele = 'A' | 'a'

function punnett(mother: [Allele, Allele], father: [Allele, Allele]) {
  const grid: [Allele, Allele][][] = [
    [
      [mother[0], father[0]],
      [mother[0], father[1]],
    ],
    [
      [mother[1], father[0]],
      [mother[1], father[1]],
    ],
  ]
  return grid
}

function phenotype(pair: [Allele, Allele]) {
  return pair.includes('A') ? 'Dominant trait' : 'Recessive trait'
}

export function PunnettSquareSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mother, setMother] = useState<[Allele, Allele]>(['A', 'a'])
  const [father, setFather] = useState<[Allele, Allele]>(['A', 'a'])
  const [version, setVersion] = useState(0)

  const grid = useMemo(() => punnett(mother, father), [mother, father])
  const dominantCount = grid.flat().filter((p) => p.includes('A')).length

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#f7f9fb'
    ctx.fillRect(0, 0, w, h)

    const size = Math.min(w, h) * 0.55
    const x0 = (w - size) / 2
    const y0 = (h - size) / 2 + 10
    const cell = size / 2

    ctx.fillStyle = '#1a252f'
    ctx.font = '600 14px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Mother: ${mother.join('')}   Father: ${father.join('')}`, w / 2, 28)

    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 2
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const x = x0 + c * cell
        const y = y0 + r * cell
        const pair = grid[r][c]
        const dom = pair.includes('A')
        ctx.fillStyle = dom ? '#d5f5e3' : '#fadbd8'
        ctx.fillRect(x, y, cell, cell)
        ctx.strokeRect(x, y, cell, cell)
        ctx.fillStyle = '#1a252f'
        ctx.font = '600 22px Roboto, sans-serif'
        ctx.fillText(pair.slice().sort().join(''), x + cell / 2, y + cell / 2 + 8)
        ctx.font = '12px Roboto, sans-serif'
        ctx.fillText(phenotype(pair), x + cell / 2, y + cell / 2 + 28)
      }
    }

    ctx.font = '13px Roboto, sans-serif'
    ctx.fillText(
      `Dominant phenotype chance: ${((dominantCount / 4) * 100).toFixed(0)}%`,
      w / 2,
      h - 18,
    )
  }, [dominantCount, father, grid, mother])

  useCanvasLoop(canvasRef, draw, false, version)

  const setPair = (who: 'm' | 'f', value: string) => {
    const pair = value.split('') as [Allele, Allele]
    if (who === 'm') setMother(pair)
    else setFather(pair)
    setVersion((v) => v + 1)
  }

  return (
    <SimShell
      title="Trait Inheritance (Punnett)"
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
          <p className="hint">A = dominant allele, a = recessive. Change parent genotypes.</p>
          <label>
            Mother genotype
            <select value={mother.join('')} onChange={(e) => setPair('m', e.target.value)}>
              <option value="AA">AA</option>
              <option value="Aa">Aa</option>
              <option value="aa">aa</option>
            </select>
          </label>
          <label>
            Father genotype
            <select value={father.join('')} onChange={(e) => setPair('f', e.target.value)}>
              <option value="AA">AA</option>
              <option value="Aa">Aa</option>
              <option value="aa">aa</option>
            </select>
          </label>
          <div className="stat">
            <span>Dominant outcomes</span>
            <strong>{dominantCount}/4</strong>
          </div>
        </>
      }
    />
  )
}
