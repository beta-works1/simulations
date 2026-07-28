import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { ElectricMotorStrings } from './ElectricMotorStrings.js'
import { ElectricMotorScreen } from './ElectricMotorScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = ElectricMotorStrings.titleStringProperty
  const screens = [new ElectricMotorScreen()]
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
