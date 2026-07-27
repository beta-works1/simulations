import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { BalanceEquationsStrings } from './BalanceEquationsStrings.js'
import { BalanceEquationsScreen } from './BalanceEquationsScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = BalanceEquationsStrings.titleStringProperty
  const screens = [new BalanceEquationsScreen()]

  const options: SimOptions = {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Inspired by PhET Interactive Simulations, University of Colorado Boulder.',
    },
  }

  const sim = new Sim(titleStringProperty, screens, options)
  sim.start()
})
