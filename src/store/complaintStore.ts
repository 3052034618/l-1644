import { create } from 'zustand'
import type { Complaint } from '@/types'
import { complaints as mockComplaints } from '@/mock'
import { loadFromStorage, saveToStorage } from './persist'

interface ComplaintState {
  complaints: Complaint[]
  _loaded: boolean
  loadComplaints: () => void
  addComplaint: (complaint: Complaint) => void
  updateComplaint: (id: string, updates: Partial<Complaint>) => void
  getComplaintsByClient: (clientId: string) => Complaint[]
}

const STORAGE_KEY = 'complaints'

export const useComplaintStore = create<ComplaintState>((set, get) => {
  const persisted = loadFromStorage<Complaint[]>(STORAGE_KEY, [])
  return {
    complaints: persisted.length > 0 ? persisted : [],
    _loaded: persisted.length > 0,
    loadComplaints: () => {
      const state = get()
      if (state._loaded) return
      const fromStorage = loadFromStorage<Complaint[]>(STORAGE_KEY, [])
      if (fromStorage.length > 0) {
        set({ complaints: fromStorage, _loaded: true })
        return
      }
      set({ complaints: [...mockComplaints], _loaded: true })
      saveToStorage(STORAGE_KEY, [...mockComplaints])
    },
    addComplaint: (complaint) => {
      set((state) => {
        const complaints = [...state.complaints, complaint]
        saveToStorage(STORAGE_KEY, complaints)
        return { complaints, _loaded: true }
      })
    },
    updateComplaint: (id, updates) => {
      set((state) => {
        const complaints = state.complaints.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
        saveToStorage(STORAGE_KEY, complaints)
        return { complaints }
      })
    },
    getComplaintsByClient: (clientId) => {
      return get().complaints.filter((c) => c.clientId === clientId)
    },
  }
})
