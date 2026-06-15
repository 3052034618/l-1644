import { create } from 'zustand'
import type { Complaint } from '@/types'
import { complaints } from '@/mock'

interface ComplaintState {
  complaints: Complaint[]
  loadComplaints: () => void
  addComplaint: (complaint: Complaint) => void
  updateComplaint: (id: string, updates: Partial<Complaint>) => void
  getComplaintsByClient: (clientId: string) => Complaint[]
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: [],
  loadComplaints: () => {
    set({ complaints: [...complaints] })
  },
  addComplaint: (complaint) => {
    set((state) => ({ complaints: [...state.complaints, complaint] }))
  },
  updateComplaint: (id, updates) => {
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  },
  getComplaintsByClient: (clientId) => {
    return get().complaints.filter((c) => c.clientId === clientId)
  },
}))
