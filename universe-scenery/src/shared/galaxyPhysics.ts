export type GalaxyType = 'spiral' | 'elliptical' | 'irregular'

export interface GalaxyInfo {
  id: GalaxyType
  label: string
  description: string
  hasArms: boolean
}

export const GALAXIES: GalaxyInfo[] = [
  { id: 'spiral', label: 'Spiral', description: 'Flat disk with rotating spiral arms — like the Milky Way.', hasArms: true },
  { id: 'elliptical', label: 'Elliptical', description: 'Smooth, oval shape with older stars and little gas.', hasArms: false },
  { id: 'irregular', label: 'Irregular', description: 'No defined shape — often shaped by collisions or bursts of star formation.', hasArms: false },
]

export function galaxyById(id: GalaxyType): GalaxyInfo {
  return GALAXIES.find((g) => g.id === id) ?? GALAXIES[0]
}

export function rotationSpeed(type: GalaxyType): number {
  return type === 'spiral' ? 12 : 4
}
