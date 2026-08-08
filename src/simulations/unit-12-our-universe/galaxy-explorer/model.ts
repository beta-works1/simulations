/** Galaxy type gallery — Unit 12, p.148. */

export type GalaxyType = 'spiral' | 'elliptical' | 'irregular'

export interface GalaxyCard {
  id: GalaxyType
  name: string
  blurb: string
  example: string
}

export const GALAXIES: GalaxyCard[] = [
  {
    id: 'spiral',
    name: 'Spiral',
    blurb: 'Flat disc with bright arms of young stars winding around a central bulge.',
    example: 'Milky Way, Andromeda',
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    blurb: 'Smooth oval of mostly older stars; little dust or spiral structure.',
    example: 'M87',
  },
  {
    id: 'irregular',
    name: 'Irregular',
    blurb: 'No clear spiral or elliptical shape — often rich in gas and star formation.',
    example: 'Large Magellanic Cloud',
  },
]

export function galaxyById(id: GalaxyType): GalaxyCard {
  return GALAXIES.find((g) => g.id === id) ?? GALAXIES[0]
}
