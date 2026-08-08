import type { GuidedStep, RecapContent } from '../../../shell/SimulationShell'

export const PRISM_GUIDED: GuidedStep[] = [
  {
    id: 'hit',
    label: 'Hit the prism',
    detail: 'Drag the light angle until the white ray hits the prism face.',
  },
  {
    id: 'normal',
    label: 'Show the normal',
    detail: 'Turn on “Show normal line” and read the angle labels.',
  },
  {
    id: 'rainbow',
    label: 'Rainbow droplet',
    detail: 'Switch to Rainbow mode — same physics inside a water drop.',
  },
]

export const PRISM_RECAP: RecapContent = {
  keyPoints: [
    'White light is a mixture of seven colours (ROYGBIV).',
    'A rainbow forms by dispersion plus internal reflection in water droplets.',
  ],
  quiz: {
    question: 'What does a glass prism do to white light?',
    choices: [
      'Splits it into ROYGBIV by refraction (dispersion)',
      'Absorbs all colours except green',
      'Reflects it with no change',
    ],
    correctIndex: 0,
  },
}

export const PRISM_SLO = [
  'Explain dispersion of white light through a prism (Fig 9.15).',
  'Relate rainbow formation to refraction, internal reflection, and dispersion (§9.4.4).',
]
