/** Monohybrid Punnett square — PTB Ch 5. Model only; Canvas draws state. */

export type Allele = 'A' | 'a'

export function punnett(mother: [Allele, Allele], father: [Allele, Allele]) {
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

export function phenotype(pair: [Allele, Allele]) {
  return pair.includes('A') ? 'Dominant' : 'Recessive'
}

export function dominantCount(grid: [Allele, Allele][][]): number {
  return grid.flat().filter((p) => p.includes('A')).length
}
