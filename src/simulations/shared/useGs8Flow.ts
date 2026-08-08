import { useCallback, useState } from 'react'

/** Shared Guided / Explore / Recap wiring for GS8 curriculum sims (not shell chrome). */
export function useGs8Flow(initialStep = 0) {
  const [guidedStepIndex, setGuidedStepIndex] = useState(initialStep)
  const [exploreMode, setExploreMode] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)

  const resetFlow = useCallback(() => {
    setGuidedStepIndex(initialStep)
    setExploreMode(false)
    setRecapOpen(false)
  }, [initialStep])

  return {
    guidedStepIndex,
    setGuidedStepIndex,
    exploreMode,
    setExploreMode,
    recapOpen,
    setRecapOpen,
    resetFlow,
  }
}
