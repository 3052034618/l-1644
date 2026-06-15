import { create } from 'zustand'
import type { Project } from '@/types'
import { projects as mockProjects } from '@/mock'
import { loadFromStorage, saveToStorage } from './persist'

interface ProjectState {
  projects: Project[]
  _loaded: boolean
  loadProjects: () => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  getProjectsByClient: (clientId: string) => Project[]
  getProjectById: (id: string) => Project | undefined
}

const STORAGE_KEY = 'projects'

export const useProjectStore = create<ProjectState>((set, get) => {
  const persisted = loadFromStorage<Project[]>(STORAGE_KEY, [])
  return {
    projects: persisted.length > 0 ? persisted : [],
    _loaded: persisted.length > 0,
    loadProjects: () => {
      const state = get()
      if (state._loaded) return
      const fromStorage = loadFromStorage<Project[]>(STORAGE_KEY, [])
      if (fromStorage.length > 0) {
        set({ projects: fromStorage, _loaded: true })
        return
      }
      set({ projects: [...mockProjects], _loaded: true })
      saveToStorage(STORAGE_KEY, [...mockProjects])
    },
    addProject: (project) => {
      set((state) => {
        const projects = [...state.projects, project]
        saveToStorage(STORAGE_KEY, projects)
        return { projects, _loaded: true }
      })
    },
    updateProject: (id, updates) => {
      set((state) => {
        const projects = state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p))
        saveToStorage(STORAGE_KEY, projects)
        return { projects }
      })
    },
    getProjectsByClient: (clientId) => {
      return get().projects.filter((p) => p.clientId === clientId)
    },
    getProjectById: (id) => {
      return get().projects.find((p) => p.id === id)
    },
  }
})
