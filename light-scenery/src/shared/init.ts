import { init, madeWithSceneryStackSplashDataURI } from 'scenerystack/init'
const name = (globalThis as { __LIGHT_SIM_NAME__?: string }).__LIGHT_SIM_NAME__ ?? 'light-sim'
init({
  name, version: '1.0.0', brand: 'made-with-scenerystack', locale: 'en',
  availableLocales: ['en'], splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: false, supportsSound: true,
})
