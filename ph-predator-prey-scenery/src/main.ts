import './brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PreyStrings } from './PreyStrings.js'
import { PredatorPreyScreen } from './predator/PredatorPreyScreen.js'

onReadyToLaunch(() => {
  const sim = new Sim(PreyStrings.titleStringProperty, [new PredatorPreyScreen()], {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Grade 8 ecology — predator–prey cycles, competition, and mutualism.',
    },
  } satisfies SimOptions)
  sim.start()
})
