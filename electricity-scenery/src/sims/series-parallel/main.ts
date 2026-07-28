import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { SeriesParallelStrings } from './SeriesParallelStrings.js'
import { SeriesParallelScreen } from './SeriesParallelScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = SeriesParallelStrings.titleStringProperty
  const screens = [new SeriesParallelScreen()]
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
