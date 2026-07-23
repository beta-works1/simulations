import { init, madeWithSceneryStackSplashDataURI } from 'scenerystack/init'

const name = (globalThis as { __NERVOUS_SIM_NAME__?: string }).__NERVOUS_SIM_NAME__ ?? 'nervous-sim'

init({
  name,
  version: '1.0.0',
  brand: 'made-with-scenerystack',
  locale: 'en',
  availableLocales: ['en'],
  splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: false,
})
