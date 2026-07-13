export type GalaxyType = 'spiral' | 'elliptical' | 'irregular'

export interface GalaxyInfo {
  id: GalaxyType
  label: string
  description: string
  hasArms: boolean
}

export interface GalaxyTypesState {
  selected: GalaxyType
  rotation: number
  running: boolean
}

export const GALAXIES: GalaxyInfo[] = [
  {
    id: 'spiral',
    label: 'Spiral',
    description: 'Flat disk with rotating spiral arms — like the Milky Way.',
    hasArms: true,
  },
  {
    id: 'elliptical',
    label: 'Elliptical',
    description: 'Smooth, oval shape with older stars and little gas.',
    hasArms: false,
  },
  {
    id: 'irregular',
    label: 'Irregular',
    description: 'No defined shape — often shaped by collisions or bursts of star formation.',
    hasArms: false,
  },
]

export function stepGalaxyTypes(state: GalaxyTypesState, dt: number): GalaxyTypesState {
  if (!state.running) return state
  const speed = state.selected === 'spiral' ? 12 : 4
  return { ...state, rotation: (state.rotation + speed * dt) % 360 }
}

export function createInitialState(): GalaxyTypesState {
  return { selected: 'spiral', rotation: 0, running: true }
}

export function galaxyById(id: GalaxyType): GalaxyInfo {
  return GALAXIES.find((g) => g.id === id) ?? GALAXIES[0]
}
