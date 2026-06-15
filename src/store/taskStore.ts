import { create } from 'zustand'
import type { Task } from '@/types'
import { tasks as mockTasks } from '@/mock'
import { loadFromStorage, saveToStorage } from './persist'

interface TaskState {
  tasks: Task[]
  _loaded: boolean
  loadTasks: () => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  getTasksByAssignee: (assigneeId: string) => Task[]
  getTasksByProject: (projectId: string) => Task[]
  getTaskById: (id: string) => Task | undefined
}

const STORAGE_KEY = 'tasks'

export const useTaskStore = create<TaskState>((set, get) => {
  const persisted = loadFromStorage<Task[]>(STORAGE_KEY, [])
  return {
    tasks: persisted.length > 0 ? persisted : [],
    _loaded: persisted.length > 0,
    loadTasks: () => {
      const state = get()
      if (state._loaded) return
      const fromStorage = loadFromStorage<Task[]>(STORAGE_KEY, [])
      if (fromStorage.length > 0) {
        set({ tasks: fromStorage, _loaded: true })
        return
      }
      set({ tasks: [...mockTasks], _loaded: true })
      saveToStorage(STORAGE_KEY, [...mockTasks])
    },
    addTask: (task) => {
      set((state) => {
        const tasks = [...state.tasks, task]
        saveToStorage(STORAGE_KEY, tasks)
        return { tasks, _loaded: true }
      })
    },
    updateTask: (id, updates) => {
      set((state) => {
        const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
        saveToStorage(STORAGE_KEY, tasks)
        return { tasks }
      })
    },
    getTasksByAssignee: (assigneeId) => {
      return get().tasks.filter((t) => t.assigneeId === assigneeId)
    },
    getTasksByProject: (projectId) => {
      return get().tasks.filter((t) => t.projectId === projectId)
    },
    getTaskById: (id) => {
      return get().tasks.find((t) => t.id === id)
    },
  }
})
