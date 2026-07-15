import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ControlHint,
  ControlSection,
  ControlSelect,
  ControlStat,
  ControlStats,
} from '../../shared/Controls'
import { clearThemedScene, fillFittedText, fontPx } from '../../shared/drawHelpers'
import { SimShell } from '../../shared/SimShell'
import { useCanvasLoop } from '../../shared/useCanvasLoop'
import { useCanvasPointer } from '../../shared/useCanvasPointer'
import {
  dominantCount as countDominant,
  phenotype,
  punnett,
  type Allele,
} from './punnettSquareModel'

type AlleleHit = { id: string; x: number; y: number; w: number; h: number }

function alleleHits(w: number, h: number): AlleleHit[] {
  const size = Math.min(w, h) * 0.62
  const x0 = (w - size) / 2
  const y0 = (h - size) / 2 + 8
  const cell = size / 2
  const box = Math.max(28, cell * 0.28)
  return [
    { id: 'm0', x: x0 - box - 8, y: y0 + cell * 0.5 - box / 2, w: box, h: box },
    { id: 'm1', x: x0 - box - 8, y: y0 + cell * 1.5 - box / 2, w: box, h: box },
    { id: 'f0', x: x0 + cell * 0.5 - box / 2, y: y0 - box - 8, w: box, h: box },
    { id: 'f1', x: x0 + cell * 1.5 - box / 2, y: y0 - box - 8, w: box, h: box },
  ]
}

function toggleAllele(a: Allele): Allele {
  return a === 'A' ? 'a' : 'A'
}

function genotypeKey(pair: [Allele, Allele]): 'AA' | 'Aa' | 'aa' {
  const dominant = pair.filter((a) => a === 'A').length
  if (dominant === 2) return 'AA'
  if (dominant === 1) return 'Aa'
  return 'aa'
}

export function PunnettSquareSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mother, setMother] = useState<[Allele, Allele]>(['A', 'a'])
  const [father, setFather] = useState<[Allele, Allele]>(['A', 'a'])
  const [version, setVersion] = useState(0)
  const hoverRef = useRef<string | null>(null)

  const grid = useMemo(() => punnett(mother, father), [mother, father])
  const dominantCount = countDominant(grid)

  const cycleAllele = (id: string) => {
    if (id === 'm0') setMother((m) => [toggleAllele(m[0]), m[1]])
    else if (id === 'm1') setMother((m) => [m[0], toggleAllele(m[1])])
    else if (id === 'f0') setFather((f) => [toggleAllele(f[0]), f[1]])
    else if (id === 'f1') setFather((f) => [f[0], toggleAllele(f[1])])
    else return
    setVersion((v) => v + 1)
  }

  useCanvasPointer(canvasRef, {
    hitTest: (pt, size) => {
      for (const hit of alleleHits(size.w, size.h)) {
        if (pt.x >= hit.x && pt.x <= hit.x + hit.w && pt.y >= hit.y && pt.y <= hit.y + hit.h) {
          return hit.id
        }
      }
      return null
    },
    cursorForHit: () => 'pointer',
    onHoverChange: (id) => {
      hoverRef.current = id
      setVersion((v) => v + 1)
    },
    onTap: (id) => {
      if (id) cycleAllele(id)
    },
  })

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
          ctx.textAlign = 'center'
          fillFittedText(ctx, pair.slice().sort().join(''), x + cell / 2, y + cell / 2 - 4, cell - 12, fs + 8, {
            minPx: 12,
            align: 'center',
          })
          ctx.font = `${Math.max(11, fs - 1)}px Roboto, sans-serif`
          ctx.fillStyle = '#5d6d7e'
          fillFittedText(ctx, phenotype(pair), x + cell / 2, y + cell / 2 + fs + 4, cell - 12, Math.max(11, fs - 1), {
            minPx: 9,
            align: 'center',
          })
        }
      }

      const labels: Record<string, Allele> = {
        m0: mother[0],
        m1: mother[1],
        f0: father[0],
        f1: father[1],
      }
      for (const hit of alleleHits(w, h)) {
        const hot = hoverRef.current === hit.id
        ctx.fillStyle = hot ? '#d6eaf8' : '#eaf2f8'
        ctx.strokeStyle = hot ? '#2980b9' : '#2c3e50'
        ctx.lineWidth = hot ? 2.5 : 1.5
        ctx.beginPath()
        ctx.roundRect(hit.x, hit.y, hit.w, hit.h, 6)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#1a252f'
        ctx.font = `700 ${fs + 4}px Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labels[hit.id], hit.x + hit.w / 2, hit.y + hit.h / 2)
      }

      ctx.fillStyle = '#1a252f'
      ctx.font = `${fs}px Roboto, sans-serif`
      ctx.textBaseline = 'alphabetic'
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
            <ControlHint>A = dominant allele, a = recessive allele. Tap edge labels to cycle.</ControlHint>
            <ControlSelect
              label="Mother genotype"
              value={genotypeKey(mother)}
              options={[
                { value: 'AA', label: 'AA' },
                { value: 'Aa', label: 'Aa' },
                { value: 'aa', label: 'aa' },
              ]}
              onChange={(v) => setPair('m', v)}
            />
            <ControlSelect
              label="Father genotype"
              value={genotypeKey(father)}
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
