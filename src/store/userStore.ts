import { create } from 'zustand'
import type { User, CreditHistoryItem } from '@/types'
import { users as mockUsers } from '@/mock'
import { loadFromStorage, saveToStorage } from './persist'

interface UserState {
  users: User[]
  _loaded: boolean
  loadUsers: () => void
  getUserById: (id: string) => User | undefined
  getAnnotatorsAndReviewers: () => User[]
  updateUser: (id: string, updates: Partial<User>) => void
  adjustCreditScore: (userId: string, change: number, reason: string, relatedComplaintId?: string) => void
  addCreditHistory: (userId: string, history: CreditHistoryItem) => void
}

const STORAGE_KEY = 'users'

export const useUserStore = create<UserState>((set, get) => {
  const persisted = loadFromStorage<User[]>(STORAGE_KEY, [])
  return {
    users: persisted.length > 0 ? persisted : [],
    _loaded: persisted.length > 0,
    loadUsers: () => {
      const state = get()
      if (state._loaded) return
      const fromStorage = loadFromStorage<User[]>(STORAGE_KEY, [])
      if (fromStorage.length > 0) {
        set({ users: fromStorage, _loaded: true })
        return
      }
      set({ users: [...mockUsers], _loaded: true })
      saveToStorage(STORAGE_KEY, [...mockUsers])
    },
    getUserById: (id) => get().users.find((u) => u.id === id),
    getAnnotatorsAndReviewers: () =>
      get().users.filter((u) => u.role === 'annotator' || u.role === 'reviewer'),
    updateUser: (id, updates) => {
      set((state) => {
        const users = state.users.map((u) => (u.id === id ? { ...u, ...updates } : u))
        saveToStorage(STORAGE_KEY, users)
        return { users }
      })
    },
    adjustCreditScore: (userId, change, reason, relatedComplaintId) => {
      const historyItem: CreditHistoryItem = {
        id: `ch_${Date.now()}`,
        change,
        reason,
        relatedComplaintId,
        createdAt: new Date().toISOString(),
      }
      set((state) => {
        const users = state.users.map((u) => {
          if (u.id !== userId) return u
          const newScore = Math.max(0, Math.min(100, (u.creditScore ?? 0) + change))
          const existingHistory = u.creditHistory ?? []
          return {
            ...u,
            creditScore: newScore,
            creditHistory: [...existingHistory, historyItem],
          }
        })
        saveToStorage(STORAGE_KEY, users)
        return { users }
      })
    },
    addCreditHistory: (userId, history) => {
      set((state) => {
        const users = state.users.map((u) =>
          u.id !== userId
            ? u
            : { ...u, creditHistory: [...(u.creditHistory ?? []), history] }
        )
        saveToStorage(STORAGE_KEY, users)
        return { users }
      })
    },
  }
})
