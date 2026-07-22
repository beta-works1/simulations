import './brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { EcologyStrings } from './EcologyStrings.js'
import { FoodWebScreen } from './ecology/FoodWebScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = EcologyStrings.titleStringProperty
  const screens = [new FoodWebScreen()]

  const options: SimOptions = {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Grade 8 ecology — food chains and food webs.',
    },
  }

  const sim = new Sim(titleStringProperty, screens, options)
  sim.start()
})
