/** Brain region → main function (book p.15). */

export type BrainRegion = 'frontal' | 'parietal' | 'temporal' | 'occipital' | 'cerebellum'

export type RegionInfo = { id: BrainRegion; label: string; functionText: string }

export const BRAIN_REGIONS: RegionInfo[] = [
  {
    id: 'frontal',
    label: 'Frontal lobe',
    functionText: 'Thinking, planning, voluntary movement, and personality.',
  },
  {
    id: 'parietal',
    label: 'Parietal lobe',
    functionText: 'Touch, pressure, pain, and spatial awareness.',
  },
  {
    id: 'temporal',
    label: 'Temporal lobe',
    functionText: 'Hearing, memory, and language understanding.',
  },
  {
    id: 'occipital',
    label: 'Occipital lobe',
    functionText: 'Vision — processing what the eyes see.',
  },
  {
    id: 'cerebellum',
    label: 'Cerebellum',
    functionText: 'Balance, posture, and smooth coordinated movement.',
  },
]

export function regionInfo(id: BrainRegion): RegionInfo {
  return BRAIN_REGIONS.find((r) => r.id === id) ?? BRAIN_REGIONS[0]
}
