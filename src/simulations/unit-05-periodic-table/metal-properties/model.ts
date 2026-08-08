/** Metal vs non-metal properties demo — Unit 5, p.51. */

export type PropertyId = 'lustre' | 'conductance' | 'malleability'

export interface PropertyDemo {
  id: PropertyId
  label: string
  metalText: string
  nonmetalText: string
}

export const PROPERTIES: PropertyDemo[] = [
  {
    id: 'lustre',
    label: 'Lustre',
    metalText: 'Metals are shiny (metallic lustre) — e.g. polished copper or aluminium.',
    nonmetalText: 'Most non-metals are dull (sulphur, carbon) — not shiny like metals.',
  },
  {
    id: 'conductance',
    label: 'Electrical conductance',
    metalText: 'Metals conduct electricity well (copper wires).',
    nonmetalText: 'Most non-metals are poor conductors (insulators); graphite is a notable exception.',
  },
  {
    id: 'malleability',
    label: 'Malleability',
    metalText: 'Metals can be hammered into sheets (malleable) or drawn into wires (ductile).',
    nonmetalText: 'Non-metals are usually brittle — they break or powder when struck.',
  },
]

export function propertyById(id: PropertyId): PropertyDemo {
  return PROPERTIES.find((p) => p.id === id) ?? PROPERTIES[0]
}
