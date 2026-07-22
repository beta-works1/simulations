import './brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { CarbonStrings } from './CarbonStrings.js'
import { CarbonOxygenScreen } from './carbon/CarbonScreen.js'

onReadyToLaunch(() => {
  const sim = new Sim(CarbonStrings.titleStringProperty, [new CarbonOxygenScreen()], {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Grade 8 carbon–oxygen cycle — photosynthesis, respiration, decomposition, combustion.',
    },
  } satisfies SimOptions)
  sim.start()
})
