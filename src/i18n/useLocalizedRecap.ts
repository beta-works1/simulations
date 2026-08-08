import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecapContent } from '../shell/SimulationShell'

/** Overlay Urdu (or other) Key Points / Quiz when translation keys exist for a sim. */
export function useLocalizedRecap(simId: string, fallback: RecapContent): RecapContent {
  const { t, i18n } = useTranslation()

  return useMemo(() => {
    const base = `sims.${simId}`
    const points = t(`${base}.keyPoints`, { returnObjects: true, defaultValue: null })
    const question = t(`${base}.quiz.question`, { defaultValue: '' })
    const choices = t(`${base}.quiz.choices`, { returnObjects: true, defaultValue: null })

    if (
      Array.isArray(points) &&
      points.every((p) => typeof p === 'string') &&
      question &&
      Array.isArray(choices) &&
      choices.every((c) => typeof c === 'string')
    ) {
      return {
        keyPoints: points as string[],
        quiz: {
          question,
          choices: choices as string[],
          correctIndex: fallback.quiz.correctIndex,
        },
      }
    }
    return fallback
  }, [fallback, i18n.language, simId, t])
}
