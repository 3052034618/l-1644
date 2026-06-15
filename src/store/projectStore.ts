import { create } from 'zustand'
import type { Project } from '@/types'
import { projects as mockProjects } from '@/mock'

interface ProjectState {
  projects: Project[]
  loadProjects: () => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  getProjectsByClient: (clientId: string) => Project[]
  getProjectById: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loadProjects: () => {
    set({ projects: [...mockProjects] })
  },
  addProject: (project) => {
    set((state) => ({ projects: [...state.projects, project] }))
  },
  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },
  getProjectsByClient: (clientId) => {
    return get().projects.filter((p) => p.clientId === clientId)
  },
  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id)
  },
}))
