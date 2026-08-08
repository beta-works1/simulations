import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LanguageCode = 'en' | 'ur'

interface AppState {
  language: LanguageCode
  soundOn: boolean
  reducedMotion: boolean
  setLanguage: (language: LanguageCode) => void
  setSoundOn: (soundOn: boolean) => void
  setReducedMotion: (reducedMotion: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      soundOn: true,
      reducedMotion: false,
      setLanguage: (language) => set({ language }),
      setSoundOn: (soundOn) => set({ soundOn }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    { name: 'gs8-app-settings' },
  ),
)
