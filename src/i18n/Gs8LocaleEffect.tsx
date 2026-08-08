import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { applyGs8DocumentPrefs } from './index'

/** Keeps i18n language + document dir / reduced-motion in sync with the app store. */
export function Gs8LocaleEffect() {
  const language = useAppStore((s) => s.language)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setReducedMotion = useAppStore((s) => s.setReducedMotion)
  const { i18n } = useTranslation()

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (mq.matches) setReducedMotion(true)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [setReducedMotion])

  useEffect(() => {
    void i18n.changeLanguage(language)
    applyGs8DocumentPrefs({ language, reducedMotion })
  }, [i18n, language, reducedMotion])

  return null
}
