export type StarMass = 'low' | 'high'
export type StarStageId =
  | 'nebula' | 'protostar' | 'main-sequence' | 'red-giant' | 'white-dwarf'
  | 'supernova' | 'neutron-star' | 'black-hole'

export interface StarStage {
  id: StarStageId
  label: string
  description: string
  duration: number
}

export const LOW_STAGES: StarStage[] = [
  { id: 'nebula', label: 'Nebula', description: 'A cloud of gas and dust begins to collapse under gravity.', duration: 4 },
  { id: 'protostar', label: 'Protostar', description: 'The core heats as material falls inward.', duration: 3.5 },
  { id: 'main-sequence', label: 'Main Sequence', description: 'Hydrogen fusion balances gravity — a stable star shines.', duration: 5 },
  { id: 'red-giant', label: 'Red Giant', description: 'The outer layers expand as hydrogen fuel runs low.', duration: 4 },
  { id: 'white-dwarf', label: 'White Dwarf', description: 'The core cools slowly, glowing faintly for billions of years.', duration: 4 },
]

export const HIGH_STAGES: StarStage[] = [
  { id: 'nebula', label: 'Nebula', description: 'A massive cloud of gas and dust collapses.', duration: 4 },
  { id: 'protostar', label: 'Protostar', description: 'A hot, dense core forms under intense gravity.', duration: 3.5 },
  { id: 'main-sequence', label: 'Main Sequence', description: 'A bright, massive star fuses hydrogen in its core.', duration: 5 },
  { id: 'red-giant', label: 'Red Supergiant', description: 'Outer layers swell enormously before the final collapse.', duration: 4 },
  { id: 'supernova', label: 'Supernova', description: 'The core collapses and the star explodes, scattering heavy elements.', duration: 3 },
  { id: 'neutron-star', label: 'Neutron Star', description: 'The remnant core spins rapidly, dense as an atomic nucleus.', duration: 4 },
  { id: 'black-hole', label: 'Black Hole', description: 'If mass is high enough, gravity wins — nothing escapes past the event horizon.', duration: 4 },
]

export function stagesForMass(mass: StarMass): StarStage[] {
  return mass === 'low' ? LOW_STAGES : HIGH_STAGES
}
