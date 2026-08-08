import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ur from './locales/ur.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n

/** Apply document-level locale / motion preferences for GS8. */
export function applyGs8DocumentPrefs(opts: {
  language: 'en' | 'ur'
  reducedMotion: boolean
}) {
  const root = document.documentElement
  root.lang = opts.language === 'ur' ? 'ur' : 'en'
  root.dir = opts.language === 'ur' ? 'rtl' : 'ltr'
  root.dataset.gs8ReducedMotion = opts.reducedMotion ? 'true' : 'false'
  if (opts.reducedMotion) {
    root.classList.add('gs8-reduced-motion')
  } else {
    root.classList.remove('gs8-reduced-motion')
  }
}
