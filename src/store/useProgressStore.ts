import Dexie, { type Table } from 'dexie'
import { create } from 'zustand'

export interface ProgressRecord {
  simId: string
  completedGuidedMode: boolean
  quizScore: number | null
  markedUnderstood: boolean
  updatedAt: number
}

class ProgressDb extends Dexie {
  progress!: Table<ProgressRecord, string>

  constructor() {
    super('gs8-progress')
    this.version(1).stores({
      progress: 'simId',
    })
  }
}

const db = new ProgressDb()

interface ProgressState {
  byId: Record<string, ProgressRecord>
  hydrated: boolean
  hydrate: () => Promise<void>
  markGuidedComplete: (simId: string) => Promise<void>
  setQuizScore: (simId: string, quizScore: number) => Promise<void>
  markUnderstood: (simId: string) => Promise<void>
}

async function upsert(partial: ProgressRecord) {
  await db.progress.put(partial)
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  byId: {},
  hydrated: false,
  hydrate: async () => {
    const rows = await db.progress.toArray()
    const byId: Record<string, ProgressRecord> = {}
    for (const row of rows) byId[row.simId] = row
    set({ byId, hydrated: true })
  },
  markGuidedComplete: async (simId) => {
    const prev = get().byId[simId]
    const next: ProgressRecord = {
      simId,
      completedGuidedMode: true,
      quizScore: prev?.quizScore ?? null,
      markedUnderstood: prev?.markedUnderstood ?? false,
      updatedAt: Date.now(),
    }
    await upsert(next)
    set((s) => ({ byId: { ...s.byId, [simId]: next } }))
  },
  setQuizScore: async (simId, quizScore) => {
    const prev = get().byId[simId]
    const next: ProgressRecord = {
      simId,
      completedGuidedMode: prev?.completedGuidedMode ?? false,
      quizScore,
      markedUnderstood: prev?.markedUnderstood ?? false,
      updatedAt: Date.now(),
    }
    await upsert(next)
    set((s) => ({ byId: { ...s.byId, [simId]: next } }))
  },
  markUnderstood: async (simId) => {
    const prev = get().byId[simId]
    const next: ProgressRecord = {
      simId,
      completedGuidedMode: prev?.completedGuidedMode ?? true,
      quizScore: prev?.quizScore ?? null,
      markedUnderstood: true,
      updatedAt: Date.now(),
    }
    await upsert(next)
    set((s) => ({ byId: { ...s.byId, [simId]: next } }))
  },
}))
